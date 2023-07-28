self.addEventListener("message", (event) => {
  try {
    const [oldTeachers, newTeachers] = event.data;

    let Schedules = [];
    let Invoices = [];

    oldTeachers.map((teacher) => {
      Schedules = [...Schedules, ...teacher["Schedules"]];
      Invoices = [...Invoices, ...teacher["Invoices"]];
    });

    newTeachers.map((teacher) => {
      Schedules = [...Schedules, ...teacher["Schedules"]];
      Invoices = [...Invoices, ...teacher["Invoices"]];
    });

    console.log(Schedules);
    console.log(Invoices);

    Schedules = [
      ...new Map(
        Schedules.map((Schedule) => [
          `${Schedule["Shift"]}-${Schedule["Name"]}-${Schedule["Date"]}-${Schedule["Time"]}`,
          Schedule,
        ])
      ).values(),
    ];
    Invoices = [
      ...new Map(
        Invoices.map((Invoice) => [
          `${Invoice["Shift"]}-${Invoice["Name"]}-${Invoice["Date"]}-${Invoice["Time"]}`,
          Invoice,
        ])
      ).values(),
    ];

    const mutatedTeachers = [
      ...new Set(
        [...oldTeachers, ...newTeachers].map((teacher) => teacher["Name"])
      ),
    ].map((teacher) => ({
      Name: teacher,
      Schedules: Schedules.filter((Schedule) => Schedule["Name"] === teacher),
      Invoices: Invoices.filter((Invoice) => Invoice["Name"] === teacher),
    }));

    postMessage({
      type: "data",
      data: mutatedTeachers,
    });
  } catch (error) {
    console.error(error);

    postMessage({
      type: "error",
      data: "An unknown error occured while processing the data.",
    });
  }
});
