self.addEventListener("message", (event) => {
  const schedules = event.data;

  let ShiftGroups = [];

  schedules.map((schedule) => ShiftGroups.push(schedule["ShiftGroup"]));

  ShiftGroups = [
    ...new Set(
      ShiftGroups.map((Group) =>
        Group.split(" ")[0] === "Rotation" ? "Rotation" : Group
      )
    ),
  ];

  let Schedules = [];

  postMessage({
    type: "message",
    data: "Processing " + ShiftGroups.length + " shift groups",
  });

  ShiftGroups.sort((a, b) => {
    if (a > b) return 1;
    if (a < b) return -1;

    return 0;
  }).map((group, index) => {
    postMessage({
      type: "message",
      data: `Processed ${index + 1}/${ShiftGroups.length} shift groups`,
    });
    postMessage({
      type: "progress",
      data: Math.ceil(((index + 1) / ShiftGroups.length) * 100),
    });

    Schedules = [
      ...Schedules,
      schedules
        .filter(
          (schedule) =>
            (schedule["ShiftGroup"].split(" ")[0] === "Rotation"
              ? "Rotation"
              : schedule["ShiftGroup"]) === group
        )
        .map((schedule) => ({ ...schedule, ShiftGroup: group })),
    ];
  });

  postMessage({ type: "data", data: Schedules });
});
