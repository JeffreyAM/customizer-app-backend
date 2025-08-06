import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Template, UserDetails } from "../types";
import { formatDate } from "../utils/common";

interface TemplateModalProps {
  selectedTemplate: Template;
  userDetails: UserDetails | null;
  modalLoading: boolean;
  pendingMockupTask: any;
  setPendingMockupTask: (task: any) => void;
  completeTemplateData: any;
  onClose: () => void;
  onFetchData: (template: Template) => Promise<void>;
}

export default function TemplateModal({
  selectedTemplate,
  userDetails,
  modalLoading,
  pendingMockupTask,
  setPendingMockupTask,
  completeTemplateData,
  onClose,
  onFetchData,
}: TemplateModalProps) {
  const isMounted = useRef(true);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  const [creatingMockup, setCreatingMockup] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [mockupResult, setMockupResult] = useState<any>(null);
  const [pollingStatus, setPollingStatus] = useState("");

  const handleCreateMockup = async () => {
    if (!selectedTemplate) return;

    try {
      setCreatingMockup(true);

      const res = await fetch(`/api/printful/product-templates/${selectedTemplate.template_id}`);
      const templateData = await res.json();

      const catalog_product_id = templateData?.result?.product_id;

      if (!catalog_product_id || isNaN(Number(catalog_product_id))) {
        toast.error("Missing or invalid catalog_product_id");
        return;
      }

      const variantIds = (selectedTemplate.variant_options || []).filter(
        (id: number) => typeof id === "number" && !isNaN(id)
      );

      const placement = templateData?.result?.placements?.[0]?.placement || "front";

      const files = [
        {
          placement,
          image_url: selectedTemplate.image_url,
          position: {
            area_width: 1800,
            area_height: 2400,
            width: 1800,
            height: 2400,
            top: 0,
            left: 0,
          },
        },
      ];

      if (!files.length || !files[0].image_url) {
        toast.error("Missing design file");
        return;
      }

      const response = await fetch("/api/printful/mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          product_template_id: selectedTemplate.template_id,
          catalog_product_id,
          variant_ids: variantIds,
          files,
        }),
      });

      const data = await response.json();

      if (response.ok && data.task) {
        toast.success(`Mockup task created! Task ID: ${data.task.task_key}`);
        setPendingMockupTask(data.task);

        // scroll to mockup result
        scrollToElement("mockup-task-polling-section");
      } else {
        toast.error(`Failed to create mockup: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      toast.error(`Error creating mockup: ${err.message}`);
    } finally {
      setCreatingMockup(false);
    }
  };

  const scrollToElement = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el && modalBodyRef.current) {
      modalBodyRef.current.scrollTop = el.offsetTop;
    }
  };

  const pollMockupTask = async (taskKey: string) => {
    setIsPolling(true);
    const interval = 5000;

    const checkStatus = async () => {
      if (!isMounted.current) return; // Stop if unmounted or modal closed
      try {
        const status = await fetchCheckMockupTasksStatus(taskKey);
        if (!isMounted.current) return;

        setPollingStatus(`Status: ${status}`);

        if (status === "completed") {
          const response = await fetch(`/api/mockup-results/${taskKey}`);
          const data = await response.json();
          if (response.ok && data.mockup_result) {
            setMockupResult(data.mockup_result);
          }

          setPollingStatus(
            `✅ Task completed <a href='#mockup-result' class='text-blue-600 underline'>View Result</a>`
          );
          setIsPolling(false);
        } else if (status === "failed") {
          setPollingStatus("❌ Task failed");
          setIsPolling(false);
        } else if (status === "pending") {
          setPollingStatus("⏳ Task in progress...");
          setTimeout(checkStatus, interval);
        } else {
          setPollingStatus("⏰ Timeout");
          setIsPolling(false);
        }
      } catch (error) {
        if (isMounted.current) {
          setPollingStatus("⚠️ Polling failed");
          setIsPolling(false);
        }
      }
    };

    checkStatus();
  };

  const fetchCheckMockupTasksStatus = async (taskKey: string) => {
    try {
      const response = await fetch(`/api/mockup-tasks/${taskKey}`);
      const data = await response.json();
      return data?.task?.status || "unknown";
    } catch (error) {
      return "unknown";
    }
  };

  const onCloseModal = () => {
    setCreatingMockup(false);
    setIsPolling(false);
    setMockupResult(null);
    setPollingStatus("");
    onClose();
  };

  useEffect(() => {
    isMounted.current = true;
    if (pendingMockupTask?.task_key) {
      pollMockupTask(pendingMockupTask.task_key);
    }
    return () => {
      isMounted.current = false;
    };
  }, [pendingMockupTask]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-0 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Modal Content */}
        <div className="relative p-5 max-h-[75vh] overflow-y-auto" ref={modalBodyRef}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Template Details</h3>
            <button onClick={onCloseModal} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
              ×
            </button>
          </div>

          {/* Fixed Polling Banner */}
          {pendingMockupTask?.task_key && (
            <div id="mockup-task-polling-section" className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-3">
                {isPolling ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span className="text-sm text-blue-800 font-medium">
                      Polling mockup task... <span className="ml-2">{pollingStatus}</span>
                    </span>
                  </>
                ) : (
                  <span
                    className="text-sm text-green-700 font-medium"
                    dangerouslySetInnerHTML={{ __html: pollingStatus || "✅ Polling complete." }}
                  />
                )}
              </div>

              {isPolling && (
                <div className="w-full bg-blue-100 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mockupResult ? 100 : 0}%` }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedTemplate.image_url && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Mockup Image</h4>
                <img
                  className="w-full h-78 object-contain rounded-lg border"
                  src={selectedTemplate.image_url}
                  alt={selectedTemplate.product_title}
                />
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Template Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Product Title:</span>
                  <p className="text-gray-900">{selectedTemplate.product_title}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Template ID:</span>
                  <p className="text-gray-900 font-mono text-xs">{selectedTemplate.template_id}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Created:</span>
                  <p className="text-gray-900">{formatDate(selectedTemplate.created_at)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Updated:</span>
                  <p className="text-gray-900">{formatDate(selectedTemplate.updated_at)}</p>
                </div>

                {selectedTemplate.user_id && (
                  <div>
                    <span className="font-medium text-gray-600">User:</span>
                    {modalLoading ? (
                      <p className="text-gray-500 text-sm">Loading user details...</p>
                    ) : userDetails ? (
                      <div className="text-gray-900">
                        <p className="font-medium">{userDetails.name}</p>
                        <p className="text-sm text-gray-600">{userDetails.email}</p>
                        <p className="text-xs text-gray-400 font-mono">ID: {selectedTemplate.user_id}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">User details not available</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Complete Template Data (from Printful API)</h4>
            {modalLoading ? (
              <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-500">
                Loading complete template data...
              </div>
            ) : completeTemplateData ? (
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border max-h-64 text-gray-500">
                {JSON.stringify(completeTemplateData, null, 2)}
              </pre>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-gray-500 text-sm">Complete template data not available</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Local Template Data</h4>
            <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border max-h-64 text-gray-500">
              {JSON.stringify(selectedTemplate, null, 2)}
            </pre>
          </div>

          {selectedTemplate.variant_options && Object.keys(selectedTemplate.variant_options).length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Variant Options</h4>
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border text-gray-500">
                {JSON.stringify(selectedTemplate.variant_options, null, 2)}
              </pre>
            </div>
          )}

          {mockupResult && (
            <div className="mt-6" id="mockup-result">
              <h5 className="text-sm font-semibold text-gray-800">Mockup Result</h5>
              <pre className="bg-white border rounded-md p-3 mt-2 text-xs text-gray-700 max-h-64 overflow-auto">
                {JSON.stringify(mockupResult, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Close
            </button>

            <button
              className={`${
                creatingMockup || isPolling ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              } text-white mx-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer`}
              onClick={handleCreateMockup}
              disabled={creatingMockup || isPolling}
            >
              {creatingMockup ? "Loading..." : mockupResult ? "Create Another Mockup" : "Create Mockup"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
