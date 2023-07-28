export const useMagicWorker = (
  functionName = "",
  functionDataset = [] || {} || "",
  onMessage = (message = "") => {},
  onProgress = (progress = 0) => {},
  onComplete = (dataset = [] || {} || "") => {}
) => {
  const worker = new Worker("/magicWorker.js");

  worker.postMessage({ functionName, functionDataset });

  worker.onmessage = (event) => {
    const { type, data } = event.data;

    switch (type) {
      case "message":
        onMessage(data);
        break;

      case "progress":
        onProgress(data);
        break;

      case "dataset":
        onComplete(data);
        break;

      case "error":
        console.error(data);
        break;

      default:
        console.error("Please provide message type when posting from worker.");
        break;
    }
  };
};
