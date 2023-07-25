onmessage = (event) => {
  let { data } = event.data;
  postMessage({
    type: "message",
    data: `Processing ${data.length} rows.`,
  });

  const teachers = {};

  data.map((schedule, index) => {
    postMessage({
      type: "message",
      data: `Processed ${index + 1}/${data.length} rows.`,
    });
    postMessage({
      type: "progress",
      data: Math.ceil((index + 1 / data.length) * 100),
    });

    const TeacherName = schedule["Teacher_Name"].split(":")[0].trim();
    const Date = schedule["Activity_Start_Time"];
    const Shift = schedule["Shift_Name"];
    const Eligible = schedule["Eligible_Status"] === "Eligible";
    const Remote = schedule["Dialogue_Remote_Teacher__c"];

    if (teachers[TeacherName]) {
      teachers[TeacherName] = [
        ...teachers[TeacherName],
        { TeacherName, Date, Shift, Eligible },
      ];
    } else {
      teachers[TeacherName] = [{ TeacherName, Date, Shift, Eligible, Remote }];
    }
  });

  postMessage({
    type: "data",
    data: [...Object.keys(teachers)].map((teacherName) => ({
      TeacherName: teacherName,
      shifts: teachers[teacherName],
    })),
  });
};
