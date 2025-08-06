"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "./AuthProvider";
import { Template, MockupData, UserDetails } from "../types";
import { formatDate, fetchUserDetails } from "../utils/common";
import TemplateList from "./TemplateList";
import TemplateModal from "./TemplateModal";

export default function TemplateDashboard() {
  const { user, signOut } = useAuth();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [completeTemplateData, setCompleteTemplateData] = useState<any>(null);
  const [mockupTask, setMockupTask] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

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

  const fetchMockupTasks = async (templateId?: string) => {
    try {
      const response = await fetch(`/api/mockup-tasks?template_id=${templateId}`);
      const data = await response.json();
      return data.tasks || [];
    } catch (error) {
      toast.error("Error fetching mockup tasks.");
      return [];
    }
  };

  const handleTemplateClick = async (template: Template) => {
    setSelectedTemplate(template);
    setShowModal(true);
    setModalLoading(true);
    setUserDetails(null);
    setCompleteTemplateData(null);
    setMockupTask(null);

    if (template.user_id) {
      await fetchUserDetails(template.user_id, setUserDetails);
    }

    await fetchCompleteTemplateData(template.template_id);

    const tasks = await fetchMockupTasks(template.id);
    const matchingTask = tasks?.[0] || null;
    setMockupTask(matchingTask);

    setModalLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTemplate(null);
    setUserDetails(null);
    setCompleteTemplateData(null);
    setMockupTask(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Template Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, Admin</span>
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

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
        </div>
      </main>

      {showModal && selectedTemplate && (
        <TemplateModal
          selectedTemplate={selectedTemplate}
          userDetails={userDetails}
          modalLoading={modalLoading}
          mockupTask={mockupTask}
          setMockupTask={setMockupTask}
          completeTemplateData={completeTemplateData}
          onClose={closeModal}
          onFetchData={handleTemplateClick}
        />
      )}
    </div>
  );
}
