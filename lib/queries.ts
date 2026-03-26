import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Job, Document as JobDocument } from "./supabase";

// Query Keys - centralized for cache invalidation
export const queryKeys = {
  jobs: ["jobs"] as const,
  job: (id: string) => ["job", id] as const,
  documents: (jobId: string) => ["documents", jobId] as const,
};

// ============================================================================
// Jobs Queries
// ============================================================================

async function fetchJobs(): Promise<Job[]> {
  const res = await fetch("/api/jobs");
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: fetchJobs,
    staleTime: 3 * 60 * 1000, // 3 minutes - jobs don't change that often
  });
}

async function fetchJob(id: string): Promise<Job> {
  const res = await fetch(`/api/jobs/${id}`);
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}

export function useJob(id: string) {
  return useQuery({
    queryKey: queryKeys.job(id),
    queryFn: () => fetchJob(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!id, // Only run if we have an ID
  });
}

// ============================================================================
// Job Mutations
// ============================================================================

type CreateJobInput = Partial<Job>;

async function createJob(input: CreateJobInput): Promise<Job> {
  const res = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create job");
  return res.json();
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      // Invalidate jobs list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
}

type UpdateJobInput = Partial<Job>;

async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  const res = await fetch(`/api/jobs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update job");
  return res.json();
}

export function useUpdateJob(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateJobInput) => updateJob(id, input),
    onSuccess: (updatedJob) => {
      // Update the job in the cache
      queryClient.setQueryData(queryKeys.job(id), updatedJob);

      // Update the job in the jobs list cache
      queryClient.setQueryData<Job[]>(queryKeys.jobs, (old) => {
        if (!old) return old;
        return old.map((job) => (job.id === id ? updatedJob : job));
      });
    },
  });
}

async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`/api/jobs/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete job");
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteJob,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.job(id) });

      // Remove from jobs list
      queryClient.setQueryData<Job[]>(queryKeys.jobs, (old) => {
        if (!old) return old;
        return old.filter((job) => job.id !== id);
      });
    },
  });
}

// ============================================================================
// Documents Queries
// ============================================================================

async function fetchDocuments(jobId: string): Promise<JobDocument[]> {
  const res = await fetch(`/api/documents?job_id=${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export function useDocuments(jobId: string) {
  return useQuery({
    queryKey: queryKeys.documents(jobId),
    queryFn: () => fetchDocuments(jobId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!jobId,
  });
}

async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete document");
}

export function useDeleteDocument(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      // Refetch documents for this job
      queryClient.invalidateQueries({ queryKey: queryKeys.documents(jobId) });
      // Refetch the job to update has_prints/has_proposal flags
      queryClient.invalidateQueries({ queryKey: queryKeys.job(jobId) });
    },
  });
}
