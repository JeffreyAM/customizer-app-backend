// components/TemplateCard.tsx
import { Template } from "../types";
import { formatDate } from "../utils/common";

interface Props {
  template: Template;
  onClick: (template: Template) => void;
}

export default function TemplateCard({ template, onClick }: Props) {
  return (
    <li
      key={template.id}
      className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onClick(template)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {template.image_url && (
            <img
              className="h-16 w-16 rounded-lg object-cover mr-4"
              src={template.image_url}
              alt={template.product_title}
            />
          )}
          <div>
            <p className="text-sm font-medium text-indigo-600 truncate">{template.product_title}</p>
            <p className="text-sm text-gray-500">Template ID: {template.template_id}</p>
            <p className="text-xs text-gray-400">{formatDate(template.created_at)}</p>
          </div>
        </div>
        <div className="flex-shrink-0 text-sm text-gray-500">
          {Object.keys(template.variant_options || {}).length} variants
        </div>
      </div>
    </li>
  );
}
