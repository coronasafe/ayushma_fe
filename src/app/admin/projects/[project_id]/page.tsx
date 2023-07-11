"use client";

import ProjectForm from "@/components/forms/projectform";
import { Button } from "@/components/ui/interactive";
import { Document, Project } from "@/types/project";
import { API } from "@/utils/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Page({ params }: { params: { project_id: string } }) {
  const { project_id } = params;
  const projectsQuery = useQuery(["project", project_id], () =>
    API.projects.get(project_id)
  );
  const project: Project | undefined = projectsQuery.data || undefined;
  const documentsQuery = useQuery(["project", project_id, "documents"], () =>
    API.documents.list(project_id)
  );
  const documents: Document[] | undefined = documentsQuery.data?.results;

  const router = useRouter();

  const docIconsClassNames = {
    1: "file-text-o",
    2: "link",
    3: "font",
  };

  const updateProjectMutation = useMutation(
    (project: Partial<Project>) => API.projects.update(project_id, project),
    {
      onSuccess: () => {
        projectsQuery.refetch();
      },
    }
  );

  const deleteProjectMutation = useMutation(
    () => API.projects.delete(project_id),
    {
      onSuccess: () => {
        router.push("/admin");
      },
    }
  );

  const setAsDefautMutation = useMutation(
    () =>
      API.projects.update(project_id, {
        is_default: true,
      }),
    {
      onSuccess: () => {
        projectsQuery.refetch();
      },
    }
  );


  const archiveProjectMutation = useMutation(
    () =>
      API.projects.update(project_id, {
        archived: !project?.archived,
      }),
    {
      onSuccess: () => {
        projectsQuery.refetch();
      },
    }
  );

  const handleProjectSave = async (project: Partial<Project>) => {
    await updateProjectMutation.mutateAsync(project);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteProjectMutation.mutateAsync();
    }
  };

  const handleArchive = async () => {
    if (confirm(`Are you sure you want to ${project?.archived ? "unarchive" : "archive"} this project?`)) {
      await archiveProjectMutation.mutateAsync();
    }
  };

  const handleSetAsDefault = async () => {
    if (confirm("Are you sure you want to set this project as default?")) {
      await setAsDefautMutation.mutateAsync();
    }
  };

  return (
    <div>
      <div className="flex gap-2 items-center">
        <h1 className="text-3xl font-black">{project?.title}</h1>
        {project?.is_default && (
          <span className="text-xs ml-2 bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
            Default
          </span>
        )}
      </div>
      <h2 className="text-2xl mt-6 font-bold mb-4">Documents</h2>
      <div className="grid grid-cols-4 gap-4 mt-8">
        {documents?.map((document, i) => (
          <Link
            href={`/admin/projects/${project_id}/documents/${document.external_id}`}
            key={i}
            className="border border-gray-300 hover:bg-gray-100 bg-white rounded-lg p-4 flex items-center gap-2"
          >
            <i
              className={`text-gray-800 fa fa-${
                docIconsClassNames[document.document_type]
              }`}
            />
            {document.title}
          </Link>
        ))}
        {!project?.archived && (
          <Link
            href={`/admin/projects/${project_id}/documents/new`}
            className="border border-dashed border-gray-300 hover:bg-gray-100 bg-white rounded-lg p-4"
          >
            <i className="far fa-plus" /> New Document
          </Link>
        )}
        {project?.archived && documents?.length === 0 && ( "No documents" )}
      </div>
      <h2 className="text-2xl mt-6 font-bold mb-4">Details</h2>
      {project && (
        <ProjectForm
          project={project}
          onSubmit={handleProjectSave}
          loading={updateProjectMutation.isLoading}
          errors={updateProjectMutation.error}
        />
      )}
      <div className="flex gap-2 mt-4 items-center justify-stretch">
        <Button className="w-full" variant="danger" onClick={handleDelete}>
          <i className="fa-regular fa-trash mr-2"></i>
          Delete Project
        </Button>
        <Button className="w-full bg-blue-500 enabled:hover:bg-blue-600" onClick={handleArchive}>
          <i className="fa-regular fa-box-archive mr-2"></i> {project?.archived ? "Unarchive" : "Archive"} Project
        </Button>
        <Button
          variant="secondary"
          className="w-full bg-slate-200 enabled:hover:bg-slate-300"
          onClick={handleSetAsDefault}
          disabled={project?.is_default}
        >
          Set as default project
        </Button>
      </div>
    </div>
  );
}
