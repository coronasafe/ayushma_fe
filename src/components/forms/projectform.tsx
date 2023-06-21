import { Project, STT_ENGINES } from "@/types/project";
import { useState } from "react";
import { Button, Input, TextArea } from "../ui/interactive";

export default function ProjectForm(props: {
    project: Partial<Project>,
    onSubmit: (project: Partial<Project>) => void,
    errors?: any
    loading?: boolean
}) {

    const { project: pro, onSubmit, errors, loading } = props;
    const [project, setProject] = useState<Partial<Project>>(pro);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(project);
    }

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2" encType="multipart/form-data">
                <Input
                    placeholder="Title"
                    value={project.title}
                    onChange={(e) => setProject({ ...project, title: e.target.value })}
                    errors={errors?.title}
                />
                <TextArea
                    placeholder="Description"
                    value={project.description}
                    onChange={(e) => setProject({ ...project, description: e.target.value })}
                    errors={errors?.description}
                />
                <TextArea
                    placeholder="Prompt"
                    value={project.prompt}
                    onChange={(e) => setProject({ ...project, prompt: e.target.value })}
                    errors={errors?.prompt}
                />
                <select
                    className="border border-gray-200 w-full bg-white rounded-lg relative transition-all flex ring-0 ring-green-500 focus-within:ring-2 focus-within:ring-offset-1 p-3"
                    value={project.stt_engine || 1}
                    onChange={(e) => setProject({ ...project, stt_engine: parseInt(e.target.value) })}
                >
                    {STT_ENGINES.map((engine, i) => (
                        <option key={engine.id} value={engine.id}>{engine.label}</option>
                    ))}
                </select>
                <Button
                    loading={loading}
                    type="submit"
                >
                    {pro.external_id ? "Save" : "Create"}
                </Button>
            </form>
        </div>
    )
}