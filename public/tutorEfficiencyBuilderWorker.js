// TODO: Make the table row builder more efficient.
const Row = (cells = []) => {
  let self = { cells };
  return self;
};

// TODO: Make the table builder more efficient.
const Table = (rows = []) => {
  let self = { rows };

  return self;
};

self.addEventListener("message", (event) => {
  const teachers = event.data;

  let ShiftGroups = [];

  teachers.map(({ Schedules }) =>
    Schedules.map((schedule) => ShiftGroups.push(schedule["ShiftGroup"]))
  );

  ShiftGroups = [
    ...new Set(
      ShiftGroups.map((Group) =>
        Group.split(" ")[0] === "Rotation" ? "Rotation" : Group
      )
    ),
  ];

  let Tables = [];

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

    const GroupShifts = {};

    teachers.map((teacher) => {
      teacher["Schedules"].map((schedule) => {
        if (!GroupShifts[schedule["Shift"]])
          GroupShifts[schedule["Shift"]] = {
            Invoices: [],
            Schedules: [],
          };

        GroupShifts[schedule["Shift"]]["Schedules"] = [
          ...GroupShifts[schedule["Shift"]]["Schedules"],
          schedule,
        ];
      });
    });

    const GroupTeachers = [
      ...new Set([
        ...Object.keys(GroupShifts)
          .map((groupShift) => {
            const GroupShift = GroupShifts[groupShift];

            return GroupShift["Schedules"]
              .filter((Schedule) =>
                Schedule["ShiftGroup"].split(" ")[0] === "Rotation"
                  ? Schedule["ShiftGroup"].split(" ")[0] === group
                  : Schedule["ShiftGroup"] === group
              )
              .map((Schedule) => Schedule["Name"])[0];
          })
          .filter((Teacher) => Teacher),
      ]),
    ].sort((a, b) => {
      if (a > b) return 1;
      if (a < b) return -1;

      return 0;
    });

    let groupDays = [];

    teachers
      .filter((teacher) => GroupTeachers.includes(teacher["Name"]))
      .map((teacher) => {
        groupDays = [
          ...new Set([
            ...groupDays,
            ...teacher["Schedules"].map((schedule) => schedule["Date"]),
          ]),
        ].sort((a, b) => {
          const aDay = a.split("-")[1];
          const bDay = b.split("-")[1];

          if (parseInt(aDay) > parseInt(bDay)) return 1;
          if (parseInt(aDay) < parseInt(bDay)) return -1;

          return 0;
        });
      });

    let headers = ["Tutor"];
    let rows = [];

    Array(groupDays.length)
      .fill(null)
      .map((_, index) => {
        headers.push(groupDays[index]);
        headers.push("Scheduled");
        headers.push("Taught");
        headers.push("No Shows");
        headers.push("Variance");
      });

    GroupTeachers.sort((a, b) => {
      if (a > b) return 1;
      if (a < b) return -1;

      return 0;
    }).map((Name) => {
      let teacherRow = [Name];

      teachers
        .filter((teacher) => teacher["Name"] === Name)
        .map((teacher) => {
          const Schedules = teacher["Schedules"];
          const Invoices = teacher["Invoices"];

          const SchedulesGroup = [
            ...new Set(Schedules.map((schedule) => schedule["ShiftGroup"])),
          ][0];

          if (
            SchedulesGroup &&
            SchedulesGroup.split(" ")[0] !== "Rotation" &&
            SchedulesGroup !== group
          ) {
            teacherRow = undefined;
            return;
          }

          Array(groupDays.length)
            .fill(null)
            .map((_, index) => {
              let scheduled =
                Schedules.filter(
                  (schedule) => schedule["Date"] === groupDays[index]
                ).length * 2 || 0;

              let taught = Invoices
                ? Invoices.filter(
                    (invoice) =>
                      invoice["Date"].split(" ")[0] === groupDays[index]
                  ).length
                : 0;

              let noShows = Invoices
                ? Invoices.filter(
                    (invoice) =>
                      invoice["Date"].split(" ")[0] === groupDays[index] &&
                      !invoice["Eligible"]
                  ).length
                : 0;

              const initialVariance = taught - scheduled;

              teacherRow.push(" ");
              teacherRow.push(scheduled);
              teacherRow.push(taught);
              teacherRow.push(noShows);
              teacherRow.push(initialVariance - noShows);
            });
        });

      if (teacherRow) rows.push(teacherRow);
    });

    const varianceRow = ["Total"];

    Array(groupDays.length)
      .fill(null)
      .map((_, index) => {
        let dayRow = [" ", 0, 0, 0, 0];

        const dayIndex = index * 5;

        rows.map((row, index) => {
          const data = row.slice(dayIndex + 2, dayIndex + 6);

          dayRow[1] += data[0];
          dayRow[2] += data[1];
          dayRow[3] += data[2];
          dayRow[4] += data[3];
        });

        varianceRow.push(dayRow[0]);
        varianceRow.push(dayRow[1]);
        varianceRow.push(dayRow[2]);
        varianceRow.push(dayRow[3]);
        varianceRow.push(dayRow[4]);
      });

    const groupTable = [headers, ...rows, varianceRow];

    Tables.push([ShiftGroups[index], groupTable]);
  });

  postMessage({ type: "data", data: Tables });
});
