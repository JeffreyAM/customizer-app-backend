import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ShopifyProductCreateResponse, Template, UserDetails } from "../types";
import { formatDate } from "../utils/common";

interface TemplateModalProps {
  selectedTemplate: Template;
  userDetails: UserDetails | null;
  pendingMockupTask: any;
  setPendingMockupTask: (task: any) => void;
  completeTemplateData: any;
  onClose: () => void;
  onFetchData: (template: Template) => Promise<void>;
}

export default function TemplateModal({
  selectedTemplate,
  userDetails,
  pendingMockupTask,
  setPendingMockupTask,
  completeTemplateData,
  onClose,
  onFetchData,
}: TemplateModalProps) {
  const isMounted = useRef(true);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  const [modalLoading, setModalLoading] = useState(true);
  const [creatingMockup, setCreatingMockup] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [mockupResult, setMockupResult] = useState<any>(null);
  const [pollingStatus, setPollingStatus] = useState("");
  const [createShopifyProductLoading, setCreateShopifyProductLoading] = useState(false);

  const [openSections, setOpenSections] = useState({
    complete: false,
    local: false,
    mockup: false,
    mockupImages: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCreateMockup = async () => {
    if (!selectedTemplate) return;

    try {
      setCreatingMockup(true);

      const variantIds = (selectedTemplate.variant_options || []).filter(
        (id: number) => typeof id === "number" && !isNaN(id)
      );

      const placement = completeTemplateData?.result?.placements?.[0]?.placement || "front";

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

      const response = await fetch("/api/printful/mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          product_template_id: selectedTemplate.template_id,
          catalog_product_id: completeTemplateData?.result?.product_id,
          variant_ids: variantIds,
        }),
      });

      const data = await response.json();

      if (response.ok && data.task) {
        toast.success(`Mockup task created! Task ID: ${data.task.task_key}`);
        setPendingMockupTask(data.task);

        // scroll to mockup result
        scrollToElement("template-details-header");
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
          await fetchMockupResult(taskKey);

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
      const response = await fetch(`/api/mockup-task/${taskKey}`);
      const data = await response.json();
      return data?.task?.status || "unknown";
    } catch (error) {
      return "unknown";
    }
  };

  const fetchMockupResult = async (taskKey?: string) => {
    try {
      if (!taskKey) {
        const mockupTaskResponse = await fetch(`/api/mockup-task?template_id=${selectedTemplate.id}&status=completed`);
        const mockupTaskData = await mockupTaskResponse.json();
        taskKey = mockupTaskData.tasks?.[0]?.task_key;

        if (!taskKey) {
          return;
        }
      }

      const response = await fetch(`/api/mockup-result/${taskKey}`);
      const data = await response.json();
      setMockupResult(data?.mockup_result || null);
    } catch (error) {
      console.error("Error fetching mockup result:", error);
      setMockupResult(null);
    }
  };

  const handleCreateShopifyProduct = async () => {
    if (!mockupResult) {
      toast.error("No mockup result available to create Shopify product");
      return;
    }

    setCreateShopifyProductLoading(true);
    try {
      const payload = {
        product_id: completeTemplateData?.result?.product_id,
        mockups : mockupResult.mockups,
        // images: getMockupImages(),
        edmTemplateId: completeTemplateData?.result?.id,
        availableVariantIds: completeTemplateData?.result?.available_variant_ids || [],
      };

      const response = await fetch("/api/shopify/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ShopifyProductCreateResponse = await response.json();

      if (!response.ok || data.productCreate.userErrors.length > 0) {
        throw new Error(data.productCreate.userErrors.map((err: any) => err.message).join(", ") || "Unknown error");
      }

      const product = data.productCreate.product;
      if (product) {
        toast.success(`Shopify Product created successfully!`);
      } else {
        toast.error("Shopify Product creation response is missing product data.");
      }
      setCreateShopifyProductLoading(false);
    } catch (error: any) {
      toast.error(`Error creating Shopify product: ${error.message}`);
      setCreateShopifyProductLoading(false);
    }
  };

  const getMockupImages = (): string[] => {
    if (!mockupResult) return [];

    return [
      ...new Set<string>(
        mockupResult.mockups.flatMap((mockup: any) => [
          mockup.mockup_url as string,
          ...(mockup.extra?.map((img: any) => img.url as string) || []),
        ])
      ),
    ];
  };

  const onCloseModal = () => {
    setCreatingMockup(false);
    setIsPolling(false);
    setMockupResult(null);
    setPollingStatus("");
    setModalLoading(false);
    onClose();
  };

  useEffect(() => {
    isMounted.current = true;

    const fetchData = async () => {
      await fetchMockupResult();
      if (pendingMockupTask?.task_key) {
        pollMockupTask(pendingMockupTask.task_key);
      }
      setModalLoading(false);
    };
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [pendingMockupTask]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-0 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Modal Content */}
        <div id="template-details-header" className="relative p-5 max-h-[75vh] overflow-y-auto" ref={modalBodyRef}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Template Details</h3>
            <button onClick={onCloseModal} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
              ×
            </button>
          </div>

          {modalLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div>
              {/* Fixed Polling Banner */}
              {pendingMockupTask?.task_key && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
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
                {selectedTemplate.image_url || completeTemplateData?.result?.mockup_file_url ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Mockup Image</h4>
                    <img
                      className="w-full h-78 object-contain rounded-lg border"
                      src={selectedTemplate.image_url || completeTemplateData?.result?.mockup_file_url}
                      alt={selectedTemplate.product_title}
                    />
                  </div>
                ) : null}

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
                        {userDetails ? (
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

              <div className="space-y-4 mt-6">
                {/* Complete Template Data Accordion */}
                <div>
                  <button
                    onClick={() => toggleSection("complete")}
                    className="w-full text-left flex items-center justify-between bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                  >
                    <h4 className="text-sm font-medium text-gray-900">Complete Template Data (from Printful API)</h4>
                    <span className="text-gray-500">{openSections.complete ? "−" : "+"}</span>
                  </button>
                  {openSections.complete && (
                    <div className="mt-2">
                      {completeTemplateData ? (
                        <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border max-h-64 text-gray-500">
                          {JSON.stringify(completeTemplateData, null, 2)}
                        </pre>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-gray-500 text-sm">Complete template data not available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Local Template Data Accordion */}
                <div>
                  <button
                    onClick={() => toggleSection("local")}
                    className="w-full text-left flex items-center justify-between bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                  >
                    <h4 className="text-sm font-medium text-gray-900">Local Template Data</h4>
                    <span className="text-gray-500">{openSections.local ? "−" : "+"}</span>
                  </button>
                  {openSections.local && (
                    <div className="mt-2">
                      <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border max-h-64 text-gray-500">
                        {JSON.stringify(selectedTemplate, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Mockup Result Accordion */}
                {mockupResult && (
                  <div>
                    <button
                      onClick={() => toggleSection("mockup")}
                      className="w-full text-left flex items-center justify-between bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                    >
                      <h5 className="text-sm font-medium text-gray-900">Mockup Result</h5>
                      <span className="text-gray-500">{openSections.mockup ? "−" : "+"}</span>
                    </button>
                    {openSections.mockup && (
                      <div className="mt-2">
                        <pre className="bg-white border rounded-md p-3 text-xs text-gray-700 max-h-64 overflow-auto">
                          {JSON.stringify(mockupResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Mockup Result Images Accordion */}
                {mockupResult && (
                  <div>
                    <button
                      onClick={() => toggleSection("mockupImages")}
                      className="w-full text-left flex items-center justify-between bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                    >
                      <h5 className="text-sm font-medium text-gray-900">Mockup Result Images</h5>
                      <span className="text-gray-500">{openSections.mockupImages ? "−" : "+"}</span>
                    </button>
                    {openSections.mockupImages && (
                      <div className="mt-2">
                        <div className="grid grid-cols-2 gap-4">
                          {getMockupImages().map((imageUrl, index) => (
                            <div key={index} className="border rounded-lg overflow-hidden">
                              <img src={imageUrl} alt={`Mockup ${index}`} className="w-full h-48 object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

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

                {mockupResult && (
                  <button
                    className={`${
                      createShopifyProductLoading || isPolling
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }
                      text-white px-4 py-2 rounded-md text-sm font-medium`}
                    onClick={handleCreateShopifyProduct}
                    disabled={createShopifyProductLoading || isPolling}
                  >
                    {createShopifyProductLoading ? "Loading..." : "Create Shopify Product"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
