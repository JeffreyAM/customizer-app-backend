"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Template, MockupData, UserDetails } from "../types";
import { formatDate, fetchUserDetails } from "../utils/common";
import TemplateList from "./TemplateList";
import TemplateModal from "./TemplateModal";
import Header from "./Header";

export default function TemplateDashboard() {

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [completeTemplateData, setCompleteTemplateData] = useState<any>(null);
  const [pendingMockupTask, setPendingMockupTask] = useState<any>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/templates");
      const data = await response.json();

      if (response.ok) {
        setTemplates(data.templates);
      } else {
        setError(data.error || "Failed to fetch templates");
        toast.error(data.error || "Failed to fetch templates");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error fetching templates: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompleteTemplateData = async (templateId: string) => {
    try {
      const response = await fetch(`/api/printful/product-templates/${templateId}`);

      if (response.ok) {
        const data = await response.json();
        setCompleteTemplateData(data);
      } else {
        setCompleteTemplateData(null);
        toast.error("Failed to fetch complete template data.");
      }
    } catch (error) {
      setCompleteTemplateData(null);
      toast.error("Error fetching complete template data.");
    }
  };

  const fetchPendingMockupTask = async (templateId?: string) => {
    try {
      const response = await fetch(`/api/mockup-task?template_id=${templateId}&status=pending`);
      const data = await response.json();
      const task = data.tasks?.[0] || null;
      return task;
    } catch (error) {
      toast.error("Error fetching mockup tasks.");
      return null;
    }
  };

  const handleTemplateClick = async (template: Template) => {
    setSelectedTemplate(template);
    setShowModal(true);
    setUserDetails(null);
    setCompleteTemplateData(null);
    setPendingMockupTask(null);

    if (template.user_id) {
      await fetchUserDetails(template.user_id, setUserDetails);
    }

    await fetchCompleteTemplateData(template.template_id);

    const pendingTask = await fetchPendingMockupTask(template.id);
    setPendingMockupTask(pendingTask);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTemplate(null);
    setUserDetails(null);
    setCompleteTemplateData(null);
    setPendingMockupTask(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          <h2 className="text-lg font-medium text-gray-900">Your Templates</h2>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Printful Saved Designs</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Saved Designs ({templates.length} total)</p>
            </div>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading templates...</div>
            ) : (
              <TemplateList templates={templates} onTemplateClick={handleTemplateClick} />
            )}
          </div>
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">API Integration</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Send POST requests to <code className="bg-gray-100 px-1 rounded">/api/printful/template</code> from
                  Shopify with:
                </p>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs">
                  {`{
  "templateId": "template-id-returned-by-printful",
  "productId": "product-id",
  "user": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}`}
                </pre>
                <div className="mt-2 text-xs">
                  <p>
                    <strong>Required:</strong> <code>templateId</code>, <code>productId</code>, <code>user</code> (for
                    tracking)
                  </p>
                  <p className="mt-1 text-gray-400">
                    Templates are automatically saved to the database. Mockup images are generated in the background if
                    not immediately available.
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => {
                    fetchTemplates();
                    toast.success("Templates refreshed!");
                  }}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {loading ? "Refreshing..." : "Refresh Templates"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showModal && selectedTemplate && (
        <TemplateModal
          selectedTemplate={selectedTemplate}
          userDetails={userDetails}
          pendingMockupTask={pendingMockupTask}
          setPendingMockupTask={setPendingMockupTask}
          completeTemplateData={completeTemplateData}
          onClose={closeModal}
          onFetchData={handleTemplateClick}
        />
      )}
    </div>
  );
}
