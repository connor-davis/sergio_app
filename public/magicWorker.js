onmessage = (event) => {
  const { functionName, functionDataset } = event.data;

  switch (functionName) {
    

    default:
      postMessage({
        type: "error",
        data: "Please provide the requested function.",
      });
      break;
  }
};
