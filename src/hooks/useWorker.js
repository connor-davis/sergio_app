export const useWorker = (
  workerName,
  workerData,
  onResponse = (responseData) => {}
) => {
  const worker = new Worker("/" + workerName + ".js");

  worker.postMessage(workerData);
  worker.onmessage = (event) => onResponse(event.data);
};
