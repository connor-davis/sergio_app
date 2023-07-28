importScripts("https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/shim.min.js");
importScripts(
  "https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"
);

const consolidateDialogues = async (
  currentDialogue,
  previousDialogue,
  onProgress = (progress) => {}
) => {
  const Groups = {};

  currentDialogue
    .map((data) => {
      return {
        ...data,
        ShiftGroup: data["ShiftGroup"],
      };
    })
    .sort((a, b) => {
      if (a["ShiftGroup"] > b["ShiftGroup"]) return 1;
      if (a["ShiftGroup"] < b["ShiftGroup"]) return -1;
      return 0;
    })
    .map((data) => {
      if (!Groups[data["ShiftGroup"]])
        Groups[data["ShiftGroup"]] = {
          Current: [],
        };

      if (!Groups[data["ShiftGroup"]]["Current"])
        Groups[data["ShiftGroup"]]["Current"] = [];

      Groups[data["ShiftGroup"]]["Current"].push(data);
    });

  previousDialogue
    .map((data) => {
      return {
        ...data,
        ShiftGroup: data["ShiftGroup"],
      };
    })
    .sort((a, b) => {
      if (a["ShiftGroup"] > b["ShiftGroup"]) return 1;
      if (a["ShiftGroup"] < b["ShiftGroup"]) return -1;
      return 0;
    })
    .map((data) => {
      if (!Groups[data["ShiftGroup"]])
        Groups[data["ShiftGroup"]] = {
          Previous: [],
        };

      if (!Groups[data["ShiftGroup"]]["Previous"])
        Groups[data["ShiftGroup"]]["Previous"] = [];

      Groups[data["ShiftGroup"]]["Previous"].push(data);
    });

  let processedDialogues = [];

  Object.keys(Groups).map((Group, index) => {
    onProgress(Math.ceil((index + 1 / Object.keys(Groups).length) * 100));

    const currentDataset = Groups[Group]["Current"] || [];
    const previousDataset = Groups[Group]["Previous"] || [];

    const previousShiftNumbers = previousDataset.map((data) => data["Shift"]);
    const currentShiftNumbers = currentDataset.map((data) => data["Shift"]);
    const lostShifts = previousShiftNumbers.filter(
      (shiftNumber) => !currentShiftNumbers.includes(shiftNumber)
    );
    const newShifts = currentShiftNumbers.filter(
      (shiftNumber) => !previousShiftNumbers.includes(shiftNumber)
    );

    const previousShiftTeachers = Object.fromEntries(
      previousDataset.map((data) => [data["Shift"], data["Name"]])
    );

    onProgress(Math.ceil((1 / 2) * 100));

    const pickedUpShifts = currentDataset
      .filter((data) => previousShiftTeachers[data["Shift"]] !== data["Name"])
      .map((data) => data["Shift"]);

    const lostButPickedUp = previousDataset
      .map((data) => data["Shift"])
      .filter((shiftNumber) => pickedUpShifts.includes(shiftNumber));

    onProgress(Math.ceil((2 / 2) * 100));

    const schedules = [
      ...[
        ...currentDataset.map((data) => {
          let ShiftType = "-";

          if (newShifts.includes(data["Shift"])) {
            ShiftType = "Pickup";

            return {
              ...data,
              ShiftType,
            };
          }

          if (pickedUpShifts.includes(data["Shift"])) {
            ShiftType = "Internal Pickup";

            return {
              ...data,
              ShiftType,
            };
          }

          return {
            ...data,
            ShiftType,
          };
        }),
        ...previousDataset
          .filter((data) => lostButPickedUp.includes(data["Shift"]))
          .map((data) => {
            return { ...data, ShiftType: "Dropped & Picked Up" };
          }),
      ],
      ...previousDataset
        .filter((data) => lostShifts.includes(data["Shift"]))
        .map((data) => ({ ...data, ShiftType: "Dropped" })),
    ];

    processedDialogues = [...processedDialogues, ...schedules];
  });

  return processedDialogues;
};

self.addEventListener("message", async (event) => {
  try {
    const [dialogData, secondaryDialogData, invoicingData, date] = event.data;

    const importSteps = 4;

    postMessage({
      type: "message",
      data: "Reading dialogue and invoice data.",
    });
    postMessage({ type: "progress", data: Math.ceil((1 / importSteps) * 100) });

    const dialogueBuffer = new FileReaderSync().readAsArrayBuffer(dialogData);
    const secondaryDialogueBuffer = new FileReaderSync().readAsArrayBuffer(
      secondaryDialogData
    );
    const invoicingBuffer = new FileReaderSync().readAsArrayBuffer(
      invoicingData
    );

    const dialogWorkbook = XLSX.read(dialogueBuffer);
    const secondaryDialogWorkbook = XLSX.read(secondaryDialogueBuffer);
    const invoicingWorkbook = XLSX.read(invoicingBuffer);

    postMessage({
      type: "message",
      data: "Retrieving dialogue and invoice sheets.",
    });
    postMessage({ type: "progress", data: Math.ceil((2 / importSteps) * 100) });

    const dialogWorksheet = dialogWorkbook.Sheets[dialogWorkbook.SheetNames[0]];
    const dialogWorksheetRows = parseInt(
      dialogWorksheet["!ref"]
        .split(":")[1]
        .substring(1, dialogWorksheet["!ref"].split(":")[1].length)
    );
    const secondaryDialogWorksheet =
      secondaryDialogWorkbook.Sheets[secondaryDialogWorkbook.SheetNames[0]];
    const secondaryDialogWorksheetRows = parseInt(
      secondaryDialogWorksheet["!ref"]
        .split(":")[1]
        .substring(1, secondaryDialogWorksheet["!ref"].split(":")[1].length)
    );
    const invoicingWorksheet =
      invoicingWorkbook.Sheets[invoicingWorkbook.SheetNames[0]];
    const invoicingWorksheetRows = parseInt(
      invoicingWorksheet["!ref"]
        .split(":")[1]
        .substring(1, invoicingWorksheet["!ref"].split(":")[1].length)
    );

    postMessage({
      type: "message",
      data: "Converting dialogue and invoice sheets.",
    });
    postMessage({ type: "progress", data: Math.ceil((3 / importSteps) * 100) });

    const dialogWorksheetJSON = XLSX.utils.sheet_to_json(dialogWorksheet, {
      header: "A",
    });

    const secondaryDialogWorksheetJSON = XLSX.utils.sheet_to_json(
      secondaryDialogWorksheet,
      {
        header: "A",
      }
    );

    const invoicingWorksheetJSON = XLSX.utils.sheet_to_json(
      invoicingWorksheet,
      {
        header: 1,
        raw: true,
      }
    );

    postMessage({
      type: "message",
      data: "Filtering dialogue and invoice range.",
    });
    postMessage({ type: "progress", data: Math.ceil((3 / importSteps) * 100) });

    const dialogRows = [...dialogWorksheetJSON].slice(
      7,
      dialogWorksheetJSON.length - 4
    );
    const secondaryDialogRows = [...secondaryDialogWorksheetJSON].slice(
      7,
      secondaryDialogWorksheetJSON.length - 4
    );
    const invoicingRows = [...invoicingWorksheetJSON].slice(
      1,
      invoicingWorksheetJSON.length
    );

    let shifts = {};

    postMessage({
      type: "message",
      data: "Processing shifts.",
    });
    postMessage({
      type: "progress",
      data: 0,
    });

    let groupBackIndex = 0;
    let nameBackIndex = 0;

    const processedDA = dialogRows.map((row, index) => {
      try {
        postMessage({
          type: "progress",
          data: Math.ceil(((index + 1) / dialogRows.length) * 100),
        });

        let Date = row["F"].split(" ")[0].replaceAll("/", "-");
        let Time = row["F"].split(" ").splice(1, 3).join(" ");
        let Shift = row["H"];

        if (!row["B"]) groupBackIndex += 1;
        else groupBackIndex = 0;

        if (!row["C"]) nameBackIndex += 1;
        else nameBackIndex = 0;

        return {
          ShiftGroup: dialogRows[index - groupBackIndex]["B"] || undefined,
          Name: dialogRows[index - nameBackIndex]["C"] || undefined,
          Date,
          Time,
          Shift,
        };
      } catch (error) {
        console.log(index + " - threw an error - " + error);
      }
    });

    const processedDB = processedDA.filter((row, index) => {
      postMessage({
        type: "progress",
        data: Math.ceil(((index + 1) / processedDA.length) * 100),
      });

      return row["Date"] === date;
    });

    groupBackIndex = 0;
    nameBackIndex = 0;

    const processedSDA = secondaryDialogRows.map((row, index) => {
      try {
        postMessage({
          type: "progress",
          data: Math.ceil(((index + 1) / secondaryDialogRows.length) * 100),
        });

        let Date = row["F"].split(" ")[0].replaceAll("/", "-");
        let Time = row["F"].split(" ").splice(1, 3).join(" ");
        let Shift = row["H"];

        if (!row["B"]) groupBackIndex += 1;
        else groupBackIndex = 0;

        if (!row["C"]) nameBackIndex += 1;
        else nameBackIndex = 0;

        return {
          ShiftGroup:
            secondaryDialogRows[index - groupBackIndex]["B"] || undefined,
          Name: secondaryDialogRows[index - nameBackIndex]["C"] || undefined,
          Date,
          Time,
          Shift,
        };
      } catch (error) {
        console.log(index + " - threw an error - " + error);
      }
    });

    const processedSDB = processedSDA.filter((row, index) => {
      postMessage({
        type: "progress",
        data: Math.ceil(((index + 1) / processedSDA.length) * 100),
      });

      return row["Date"] === date;
    });

    postMessage({
      type: "message",
      data: "Consolidating dialogue data.",
    });
    postMessage({
      type: "progress",
      data: 0,
    });

    const processedDC = await consolidateDialogues(
      processedDB,
      processedSDB,
      (progress) => postMessage({ type: "progress", data: progress })
    );

    postMessage({
      type: "message",
      data: "Processing consolidated dialogue data.",
    });
    postMessage({
      type: "progress",
      data: 0,
    });

    processedDC.map((row, index) => {
      postMessage({
        type: "progress",
        data: Math.ceil(((index + 1) / processedDB.length) * 100),
      });

      if (!shifts[row["Shift"]]) {
        shifts[row["Shift"]] = {
          Group: row["ShiftGroup"],
          ScheduledShifts: [row],
          Invoices: [],
        };
      } else {
        shifts[row["Shift"]]["ScheduledShifts"] = [
          ...shifts[row["Shift"]]["ScheduledShifts"],
          row,
        ];
      }
    });

    postMessage({
      type: "message",
      data: "Processing teachers, groups, schedules and invoices.",
    });
    postMessage({
      type: "progress",
      data: 0,
    });

    invoicingRows
      .map((row, index) => {
        postMessage({
          type: "progress",
          data: Math.ceil(((index + 1) / invoicingRows.length) * 100),
        });

        const Faculty = row[3];
        const Name = row[4].split(" : ")[0].trim();
        const Eligible = row[5] === "Eligible";
        const Date = row[7].split(" ")[0].replaceAll("/", "-");
        const Time = row[7].split(" ")[1] + row[7].split(" ")[2];
        const Shift = row[9];

        return {
          Faculty,
          Name,
          Eligible,
          Date,
          Time,
          Shift,
        };
      })
      .filter((row, index) => {
        postMessage({
          type: "progress",
          data: Math.ceil(((index + 1) / invoicingRows.length) * 100),
        });

        return row["Date"] === date;
      })
      .map((row, index) => {
        postMessage({
          type: "progress",
          data: Math.ceil(((index + 1) / invoicingRows.length) * 100),
        });

        if (!shifts[row["Shift"]]) {
          shifts[row["Shift"]] = {
            Group: "Rotation",
            ScheduledShifts: [],
            Invoices: [row],
          };
        } else {
          shifts[row["Shift"]]["Invoices"] = [
            ...shifts[row["Shift"]]["Invoices"],
            row,
          ];
        }
      });

    postMessage({
      type: "message",
      data: "Processing teachers, groups, schedules and invoices.",
    });
    postMessage({
      type: "progress",
      data: 0,
    });

    const shiftGroups = {};

    Object.keys(shifts).map((Shift, index) => {
      postMessage({
        type: "progress",
        data: Math.ceil(((index + 1) / Object.keys(shifts).length) * 100),
      });

      const shiftRow = shifts[Shift];

      if (!shiftGroups[shiftRow["Group"]])
        shiftGroups[shiftRow["Group"]] = {
          Schedules: [],
          Invoices: [],
        };

      shiftGroups[shiftRow["Group"]]["Schedules"] = [
        ...shiftGroups[shiftRow["Group"]]["Schedules"],
        ...shiftRow["ScheduledShifts"],
      ];
      shiftGroups[shiftRow["Group"]]["Invoices"] = [
        ...shiftGroups[shiftRow["Group"]]["Invoices"],
        ...shiftRow["Invoices"],
      ];
    });

    let dialogueTeachers = {};

    Object.keys(shiftGroups).map((Group, index) => {
      postMessage({
        type: "progress",
        data: Math.ceil(((index + 1) / Object.keys(shiftGroups).length) * 100),
      });

      const groupRow = shiftGroups[Group];

      groupRow["Schedules"].map((row, index) => {
        if (!dialogueTeachers[row["Name"]])
          dialogueTeachers[row["Name"]] = {
            Name: row["Name"],
            Invoices: [],
            Schedules: [],
          };

        dialogueTeachers[row["Name"]]["Schedules"] = [
          ...dialogueTeachers[row["Name"]]["Schedules"],
          row,
        ];
      });

      groupRow["Invoices"].map((row, index) => {
        if (!dialogueTeachers[row["Name"]])
          dialogueTeachers[row["Name"]] = {
            Name: row["Name"],
            Invoices: [],
            Schedules: [],
          };

        dialogueTeachers[row["Name"]]["Invoices"] = [
          ...dialogueTeachers[row["Name"]]["Invoices"],
          row,
        ];
      });
    });

    dialogueTeachers = Object.keys(dialogueTeachers).map((teacher) => ({
      ...dialogueTeachers[teacher],
      Name: teacher,
    }));

    let processedGroups = [];
    let processedSchedules = [];
    let processedInvoices = [];

    const processedTeachers = dialogueTeachers.map((row, index) => {
      postMessage({
        type: "progress",
        data: Math.ceil(((index + 1) / dialogueTeachers.length) * 100),
      });

      const Name = row["Name"];
      const Group = row["Group"];
      const Invoices = row["Invoices"];
      const Schedules = row["Schedules"];

      processedGroups.push(Group);

      Schedules.map((schedule, index) => {
        postMessage({
          type: "progress",
          data: Math.ceil(((index + 1) / Schedules.length) * 100),
        });

        processedSchedules.push(schedule);
      });

      Invoices.map((invoice, index) => {
        postMessage({
          type: "progress",
          data: Math.ceil(((index + 1) / Invoices.length) * 100),
        });

        processedInvoices.push(invoice);
      });

      return {
        Name,
        Group,
        Schedules,
        Invoices,
      };
    });

    processedGroups = [...new Set(processedGroups)];

    console.log([
      processedTeachers,
      processedGroups,
      processedSchedules,
      processedInvoices,
      {
        Teachers: processedTeachers.length,
        Groups: processedGroups.length,
        Schedules: processedSchedules.length,
        Invoices: processedInvoices.length,
      },
    ]);

    postMessage({
      type: "data",
      data: [
        processedTeachers,
        processedGroups,
        processedSchedules,
        processedInvoices,
        {
          Teachers: processedTeachers.length,
          Groups: processedGroups.length,
          Schedules: processedSchedules.length,
          Invoices: processedInvoices.length,
        },
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
