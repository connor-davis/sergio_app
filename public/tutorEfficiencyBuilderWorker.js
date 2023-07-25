onmessage = (event) => {
  const { schedules, lostSchedules, teachers } = event.data;

  let ShiftGroups = [];

  schedules.map((schedules) =>
    schedules.map((schedule) => ShiftGroups.push(schedule["ShiftGroup"]))
  );
  lostSchedules.map((schedules) =>
    schedules.map((schedule) => ShiftGroups.push(schedule["ShiftGroup"]))
  );

  ShiftGroups = [...new Set(ShiftGroups)];

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

    const groupSchedules = JSON.parse(
      `[${[...Object.keys(schedules)]
        .map((day) => schedules[day])
        .map((schedule) =>
          JSON.stringify(schedule).replace("[", "").replace("]", "")
        )
        .join(",")}]`
    ).filter((schedule) => schedule["ShiftGroup"] === group);

    const groupLostSchedules = JSON.parse(
      `[${[...Object.keys(lostSchedules)]
        .map((day) => lostSchedules[day])
        .map((schedule) =>
          JSON.stringify(schedule).replace("[", "").replace("]", "")
        )
        .join(",")}]`
    ).filter((schedule) => schedule["ShiftGroup"] === group);

    const groupTeachers = [
      ...new Set(
        [...groupSchedules, ...groupLostSchedules].map(
          (schedule) => schedule["Name"]
        )
      ),
    ];

    const groupDays = [
      ...new Set(
        [...groupSchedules, ...groupLostSchedules].map(
          (schedule) => schedule["Date"]
        )
      ),
    ];

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

    groupTeachers
      .sort((a, b) => {
        if (a > b) return 1;
        if (a < b) return -1;

        return 0;
      })
      .map((teacherName) => {
        let teacherRow = [teacherName];
        const teacherFound = teachers.filter(
          (teacher) => teacher["TeacherName"] === teacherName
        )[0];

        if (!teacherFound) {
          Array(groupDays.length)
            .fill(null)
            .map((_, index) => {
              teacherRow.push(" ");
              teacherRow.push(0);
              teacherRow.push(0);
              teacherRow.push(0);
              teacherRow.push(0);
            });
        } else {
          Array(groupDays.length)
            .fill(null)
            .map((_, index) => {
              let scheduled =
                groupSchedules.filter(
                  (schedule) =>
                    schedule["Date"] === groupDays[index] &&
                    schedule["Name"] === teacherName
                ).length * 2 || 0;

              let taught = teacherFound.shifts
                ? teacherFound.shifts.filter(
                    (schedule) =>
                      schedule["Date"].split(" ")[0] === groupDays[index]
                  ).length
                : 0;

              let noShows = taught - scheduled < 0 ? -(taught - scheduled) : 0;

              teacherRow.push(" ");
              teacherRow.push(scheduled);
              teacherRow.push(taught);
              teacherRow.push(noShows);
              teacherRow.push(noShows === 0 ? taught - scheduled : -noShows);
            });
        }

        rows.push(teacherRow);
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

    console.log(groupTable);

    Tables.push([ShiftGroups[index], groupTable]);
  });

  postMessage({ type: "data", data: Tables });
};
