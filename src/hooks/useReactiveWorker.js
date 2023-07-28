import { useEffect, useState } from "react";

export const useReactiveWorker = (name, dataset = undefined) => {
  const [data, setData] = useState(undefined);
  const [message, setMessage] = useState(undefined);
  const [progress, setProgress] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [workerData, setWorkerData] = useState(dataset);

  useEffect(() => {
    const disposableTimeout = setTimeout(() => {
      if (workerData) {
        const worker = new Worker("/" + name + ".js");

        worker.postMessage(workerData);
        worker.onmessage = (event) => {
          const { type, data } = event.data;

          switch (type) {
            case "message":
              setMessage(data);
              break;
            case "progress":
              setProgress(data);
              break;
            case "data":
              setData(data);
              break;
            case "error":
              setError(data);
              break;
            default:
              break;
          }
        };
      }
    });

    return () => {
      clearTimeout(disposableTimeout);
    };
  }, [workerData]);

  return [data, message, progress, error, setWorkerData];
};
