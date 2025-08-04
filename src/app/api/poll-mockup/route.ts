const printfulApiKey = "YOUR_PRINTFUL_API_KEY";
const taskKey = "gt-809467766";

const pollTaskStatus = async (taskKey: String) => {
  try {
    const response = await fetch(
      `https://api.printful.com/mockup-generator/task?task_key=${taskKey}`,
      {
        headers: {
          Authorization: `Bearer ${printfulApiKey}`,
        },
      }
    );

    const data = await response.json();

    if (data.result.status === "completed") {
      console.log("Task completed successfully!");
      // Retrieve and process the mockup and print-ready files
      const mockups = data.result.mockups;
      const printfiles = data.result.printfiles;
      console.log("Mockups:", mockups);
      console.log("Print-ready files:", printfiles);
      // Store or reference the files for product creation
      // ...
      return;
    } else if (data.result.status === "failed") {
      console.error("Task failed:", data.result.error);
      // Handle failure: log the error and send an alert
      // ...
      return;
    } else {
      // If the task is still pending, poll again after a delay
      console.log("Task is still pending, polling again in 10 seconds...");
      setTimeout(() => pollTaskStatus(taskKey), 10000);
    }
  } catch (error) {
    console.error("An error occurred while polling:", error);
    // Handle network errors or other exceptions
    // ...
  }
};

pollTaskStatus(taskKey);
