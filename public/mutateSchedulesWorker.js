self.addEventListener("message", (event) => {
  try {
    const [oldSchedules, newSchedules] = event.data;

    postMessage({
      type: "data",
      data: [
        ...new Map(
          [...oldSchedules, ...newSchedules].map((schedule) => [
            `${schedule["ShiftGroup"]}-${schedule["Shift"]}-${schedule["ShiftType"]}-${schedule["Name"]}-${schedule["Date"]}-${schedule["Time"]}`,
            schedule,
          ])
        ).values(),
      ],
    });
  } catch (error) {
    console.error(error);

    postMessage({
      type: "error",
      data: "An unknown error occured while processing the data.",
    });
  }
});
