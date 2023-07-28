self.addEventListener("message", (event) => {
  const { schedules, selectedDate } = event.data;

  postMessage({
    type: "data",
    data: schedules.filter((schedule) => schedule["Date"] === selectedDate),
  });
});
