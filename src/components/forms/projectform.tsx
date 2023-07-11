import { MODELS, Project, STT_ENGINES } from "@/types/project";
import { useState } from "react";
import { Button, Input, TextArea } from "../ui/interactive";

export default function ProjectForm(props: {
  project: Partial<Project>;
  onSubmit: (project: Partial<Project>) => void;
  errors?: any;
  loading?: boolean;
}) {
  const { project: pro, onSubmit, errors, loading } = props;
  const [project, setProject] = useState<Partial<Project>>(pro);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(project);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2"
        encType="multipart/form-data"
      >
        <p className="text-sm text-gray-500">
          Title
        </p>
        <Input
          placeholder="Title"
          value={project.title}
          onChange={(e) => setProject({ ...project, title: e.target.value })}
          errors={errors?.title}
        />
        <p className="text-sm text-gray-500">
          Description
        </p>
        <TextArea
          placeholder="Description"
          value={project.description}
          onChange={(e) =>
            setProject({ ...project, description: e.target.value })
          }
          errors={errors?.description}
        />
        <p className="text-sm text-gray-500">
          Prompt
        </p>
        <TextArea
          placeholder="Prompt"
          className="h-56"
          value={project.prompt}
          onChange={(e) => setProject({ ...project, prompt: e.target.value })}
          errors={errors?.prompt}
        />
        <p className="text-sm text-gray-500">
          Speech to text engine
        </p>
        <select
          className="border border-gray-200 w-full bg-white rounded-lg relative transition-all flex ring-0 ring-green-500 focus-within:ring-2 focus-within:ring-offset-1 p-3"
          value={project.stt_engine ?? 1}
          onChange={(e) =>
            setProject({ ...project, stt_engine: parseInt(e.target.value) })
          }
        >
          {STT_ENGINES.map((engine, i) => (
            <option key={engine.id} value={engine.id}>
              {engine.label}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500">
          Model
        </p>
        <select
          className="border border-gray-200 w-full bg-white rounded-lg relative transition-all flex ring-0 ring-green-500 focus-within:ring-2 focus-within:ring-offset-1 p-3"
          value={project.model ?? 1}
          onChange={(e) =>
            setProject({ ...project, model: parseInt(e.target.value) })
          }
        >
          {MODELS.map((model, i) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </select>
        <Button loading={loading} type="submit" className="mt-4">
        <i className="fa-regular fa-floppy-disk mr-2"></i>{pro.external_id ? "Save" : "Create"}
        </Button>
      </form>
    </div>
  );
}
