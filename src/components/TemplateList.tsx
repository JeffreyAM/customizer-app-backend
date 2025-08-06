// components/TemplateList.tsx
import { Template } from "../types";
import TemplateCard from "./TemplateCard";

interface Props {
  templates: Template[];
  onTemplateClick: (template: Template) => void;
}

export default function TemplateList({ templates, onTemplateClick }: Props) {
  if (templates.length === 0) {
    return <div className="text-center py-12 text-gray-500">No Saved Designs found.</div>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} onClick={onTemplateClick} />
      ))}
    </ul>
  );
}
