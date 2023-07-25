import { clsx } from "clsx";
import { compareAsc, format, getDaysInMonth, parse } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const sortBy = (rows, categories = []) => {
  return categories.length > 0
    ? rows.sort((a, b) => {
        const aCategorified = categories
          .map((category) =>
            category === "Date" || category === "Time"
              ? parse(a[category], "M/d/yyyy", Date.now())
              : a[category]
          )
          .join("");
        const bCategorified = categories
          .map((category) =>
            category === "Date" || category === "Time"
              ? parse(b[category], "M/d/yyyy", Date.now())
              : b[category]
          )
          .join("");

        if (aCategorified > bCategorified) return 1;
        if (aCategorified < bCategorified) return -1;

        return 0;
      })
    : rows.sort((a, b) => {
        if (
          compareAsc(
            parse(a["Date"], "M/d/yyyy", Date.now()),
            parse(b["Date"], "M/d/yyyy", Date.now())
          ) +
            a["Name"] +
            compareAsc(
              parse(a["Time"], "h:mm a", Date.now()),
              parse(b["Time"], "h:mm a", Date.now())
            ) >
          compareAsc(
            parse(b["Date"], "M/d/yyyy", Date.now()),
            parse(a["Date"], "M/d/yyyy", Date.now())
          ) +
            b["Name"] +
            compareAsc(
              parse(b["Time"], "h:mm a", Date.now()),
              parse(a["Time"], "h:mm a", Date.now())
            )
        )
          return 1;
        if (
          compareAsc(
            parse(a["Date"], "M/d/yyyy", Date.now()),
            parse(b["Date"], "M/d/yyyy", Date.now())
          ) +
            a["Name"] +
            compareAsc(
              parse(a["Time"], "h:mm a", Date.now()),
              parse(b["Time"], "h:mm a", Date.now())
            ) <
          compareAsc(
            parse(b["Date"], "M/d/yyyy", Date.now()),
            parse(a["Date"], "M/d/yyyy", Date.now())
          ) +
            b["Name"] +
            compareAsc(
              parse(b["Time"], "h:mm a", Date.now()),
              parse(a["Time"], "h:mm a", Date.now())
            )
        )
          return -1;
        return 0;
      });
};

export const processInvoicingReportData = async (
  { data },
  selectedDay = "",
  onEvent = (message) => {},
  onProgress = (progress) => {},
  onComplete = (data) => {}
) => {
  const worker = new Worker("/invoicingRowProcessorWorker.js");

  worker.postMessage({
    data,
    selectedDay,
  });

  worker.onmessage = (event) => {
    const message = event.data;

    switch (message.type) {
      case "progress":
        onProgress(message.data);
        break;
      case "message":
        onEvent(message.data);
        break;
      case "data":
        onEvent("Processing complete.");

        onComplete(message.data);
        break;
    }
  };
};

export const processDialogueData = async (
  buffer,
  day,
  onEvent = (message) => {},
  onProgress = (progress) => {},
  onComplete = (data) => {}
) => {
  const steps = 2;

  const Workbook = new ExcelJS.Workbook();

  onEvent("Loading excel file.");

  await Workbook.xlsx.load(buffer);

  const DialogueSheet = Workbook.getWorksheet("Dialogue Scheduled Shifts - II");

  DialogueSheet.unprotect();
  DialogueSheet.unMergeCells();

  onProgress(Math.ceil((1 / steps) * 100));
  onEvent("Processing rows.");

  const worker = new Worker("/dialogRowProcessorWorker.js");

  worker.postMessage({
    rows: DialogueSheet.getRows(12, DialogueSheet.actualRowCount - 9),
  });

  worker.onmessage = (event) => {
    const message = event.data;

    switch (message.type) {
      case "progress":
        onProgress(message.data);
        break;
      case "message":
        onEvent(message.data);
        break;
      case "data":
        onEvent("Processing complete.");

        const data = message.data
          .map((schedule) => ({
            ...schedule,
            Date: format(
              parse(schedule["Date"], "M/d/yyyy h:mm a", Date.now()),
              "M/d/yyyy"
            ),
            Time: format(
              parse(schedule["Date"], "M/d/yyyy h:mm a", Date.now()),
              "h:mm a"
            ),
          }))
          .filter(
            (schedule) =>
              format(
                parse(schedule["Date"], "M/d/yyyy", Date.now()),
                "M-d-yyyy"
              ) === day
          );

        onComplete(data);
        break;
    }
  };
};

export const sortByDayNameTime = (rows) => {
  return rows.sort((a, b) => {
    if (
      compareAsc(
        parse(a["Date"], "M/d/yyyy", Date.now()),
        parse(b["Date"], "M/d/yyyy", Date.now())
      ) +
        a["Name"] +
        compareAsc(
          parse(a["Time"], "h:mm a", Date.now()),
          parse(b["Time"], "h:mm a", Date.now())
        ) >
      compareAsc(
        parse(b["Date"], "M/d/yyyy", Date.now()),
        parse(a["Date"], "M/d/yyyy", Date.now())
      ) +
        b["Name"] +
        compareAsc(
          parse(b["Time"], "h:mm a", Date.now()),
          parse(a["Time"], "h:mm a", Date.now())
        )
    )
      return 1;
    if (
      compareAsc(
        parse(a["Date"], "M/d/yyyy", Date.now()),
        parse(b["Date"], "M/d/yyyy", Date.now())
      ) +
        a["Name"] +
        compareAsc(
          parse(a["Time"], "h:mm a", Date.now()),
          parse(b["Time"], "h:mm a", Date.now())
        ) <
      compareAsc(
        parse(b["Date"], "M/d/yyyy", Date.now()),
        parse(a["Date"], "M/d/yyyy", Date.now())
      ) +
        b["Name"] +
        compareAsc(
          parse(b["Time"], "h:mm a", Date.now()),
          parse(a["Time"], "h:mm a", Date.now())
        )
    )
      return -1;
    return 0;
  });
};

export const consolidateData = (
  previousDataset,
  currentDataset,
  onEvent = (message) => {},
  onProgress = (progress) => {},
  onComplete = (data) => {}
) => {
  const steps = 2;

  onEvent("Processing shift numbers.");

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
  onEvent("Processing picked up and lost shifts.");

  const pickedUpShifts = currentDataset
    .filter((data) => previousShiftTeachers[data["Shift"]] !== data["Name"])
    .map((data) => data["Shift"]);

  const lostButPickedUp = previousDataset
    .map((data) => data["Shift"])
    .filter((shiftNumber) => pickedUpShifts.includes(shiftNumber));

  onProgress(Math.ceil((2 / 2) * 100));

  const schedules = [
    sortByDayNameTime([
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
    ]),
    sortByDayNameTime(
      previousDataset.filter((data) => lostShifts.includes(data["Shift"]))
    ),
  ];

  onComplete(
    schedules[0],
    schedules[1],
    [
      ...new Set(
        [...schedules[0], ...schedules[1]].map((schedule) => schedule["Name"])
      ),
    ].sort((a, b) => {
      if (a > b) return 1;
      if (a < b) return -1;

      return 0;
    })
  );
};

// export const consolidatorPivotBuilder = (
//   schedules = [],
//   selectedDate = Date.now(),
//   Sheet
// ) => {
//   return new Promise((resolve, reject) => {
//     try {
//       Sheet.addTable({
//         name: format(selectedDate, "MMM-yy"),
//         ref: "A1",
//         headerRow: true,
//         totalsRow: true,
//         columns: [
//           { name: "Tutor", totalsRowLabel: "Grand Total", filterButton: true },
//           {
//             name: "Pickups",
//             totalsRowFunction: "sum",
//             filterButton: false,
//           },
//           {
//             name: "Internal Pickups",
//             totalsRowFunction: "sum",
//             filterButton: false,
//           },
//           {
//             name: "Dropped & Picked Up",
//             totalsRowFunction: "sum",
//             filterButton: false,
//           },
//           {
//             name: "Dropped",
//             totalsRowFunction: "sum",
//             filterButton: false,
//           },
//         ],
//         rows: [...new Set(schedules.map((schedule) => schedule["Name"]))]
//           .sort((a, b) => {
//             if (a.substring(0, 1) > b.substring(0, 1)) return 1;
//             if (a.substring(0, 1) < b.substring(0, 1)) return -1;

//             return 0;
//           })
//           .map((teacher) => [
//             teacher,
//             schedules.filter(
//               (_schedule) =>
//                 _schedule["Name"] === teacher &&
//                 _schedule["ShiftType"] === "Pickup"
//             ).length,
//             schedules.filter(
//               (_schedule) =>
//                 _schedule["Name"] === teacher &&
//                 _schedule["ShiftType"] === "Internal Pickup"
//             ).length,
//             schedules.filter(
//               (_schedule) =>
//                 _schedule["Name"] === teacher &&
//                 _schedule["ShiftType"] === "Dropped & Picked Up"
//             ).length,
//             schedules.filter(
//               (_schedule) =>
//                 _schedule["Name"] === teacher &&
//                 _schedule["ShiftType"] === "Dropped"
//             ).length,
//           ]),
//       });

//       resolve(Sheet);
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

// export const teachersEfficiencyPivotBuilder = (
//   schedules = [],
//   teachers = [],
//   days = [],
//   Sheet
// ) => {
//   days = days.map((day, index) => {
//     const cellIndex = index * 5;

//     const teachersDay = teachers
//       .sort((a, b) => {
//         if (a["teacherName"] > b["teacherName"]) return 1;
//         if (a["teacherName"] < b["teacherName"]) return -1;

//         return 0;
//       })
//       .map((teacher) => {
//         let scheduled =
//           schedules.filter(
//             (schedule) =>
//               schedule["Date"] === format(day, "M/d/yyyy") &&
//               schedule["Name"] === teacher.teacherName
//           ).length * 2;

//         let taught = teacher.shifts
//           ? teacher.shifts.filter(
//               (schedule) =>
//                 format(
//                   parse(
//                     schedule["Activity_Start_Time"],
//                     "M/d/yyyy hh:mm:ss a",
//                     Date.now()
//                   ),
//                   "M/d/yyyy"
//                 ) === format(day, "M/d/yyyy")
//             ).length
//           : 0;
//         let noShows = teacher.shifts
//           ? teacher.shifts.filter(
//               (schedule) =>
//                 format(
//                   parse(
//                     schedule["Activity_Start_Time"],
//                     "M/d/yyyy hh:mm:ss a",
//                     Date.now()
//                   ),
//                   "M/d/yyyy"
//                 ) === format(day, "M/d/yyyy") &&
//                 schedule["Eligible_Status"].includes("Not Eligible")
//             ).length
//           : 0;

//         const initial = ["-", scheduled, taught, noShows];
//         const taughtMinusScheduled = initial[2] - initial[1];

//         return [...initial, taughtMinusScheduled - initial[3]];
//       });

//     return {
//       name: format(day, "M/d/yyyy"),
//       ref: `${Sheet.getColumn(cellIndex + 2).letter}1`,
//       headerRow: true,
//       totalsRow: true,
//       columns: [
//         {
//           name: format(day, "M/d/yyyy"),
//           filterButton: false,
//         },
//         {
//           name: "Scheduled",
//           totalsRowFunction: "sum",
//           filterButton: false,
//         },
//         {
//           name: "Taught",
//           totalsRowFunction: "sum",
//           filterButton: false,
//         },
//         {
//           name: "No Shows",
//           totalsRowFunction: "sum",
//           filterButton: false,
//         },
//         {
//           name: "Variance",
//           totalsRowFunction: "sum",
//           filterButton: false,
//         },
//       ],
//       rows: teachersDay,
//     };
//   });

//   return new Promise((resolve, reject) => {
//     try {
//       Sheet.addTable({
//         name: "Tutor",
//         ref: "A1",
//         headerRow: true,
//         totalsRow: true,
//         columns: [{ name: "Tutor", filterButton: false }],
//         rows: teachers
//           .sort((a, b) => {
//             if (a["teacherName"] > b["teacherName"]) return 1;
//             if (a["teacherName"] < b["teacherName"]) return -1;

//             return 0;
//           })
//           .map((teacher) => [teacher.teacherName]),
//       });

//       days.map((day) => Sheet.addTable(day));

//       resolve(Sheet);
//     } catch (error) {
//       resolve(error);
//     }
//   });
// };

const consolidatedSheet = (schedules = [], selectedDate = Date.now()) => {
  const workbook = XLSX.utils.book_new();

  Array(getDaysInMonth(selectedDate))
    .fill(null)
    .map((_, index) => {
      return {
        day: index + 1,
        schedules: sortBy(
          schedules.filter(
            (schedule) => parseInt(schedule["Day"]) === index + 1
          ),
          ["Date", "ShiftGroup", "Name", "Time"]
        ),
      };
    })
    .filter(({ schedules }) => schedules.length > 0)
    .map(({ schedules, day }) => {
      const worksheet = XLSX.utils.json_to_sheet(schedules);

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        `${format(selectedDate, "M")}-${day}-${format(selectedDate, "yyyy")}`
      );
    });

  XLSX.writeFile(
    workbook,
    "AutomaticReport-Consolidated-Data-" +
      format(Date.now(), "yyyy-MM-dd-hh-mm-ss") +
      ".xlsx",
    { cellStyles: true, bookType: "xlsx" }
  );
};

export const exportSchedules = async (
  schedules = [],
  teachers = [],
  selectedDate = Date.now()
) => {
  consolidatedSheet(schedules, selectedDate);

  // const Workbook = new ExcelJS.Workbook();

  // Workbook.creator = "LoneWolf Software | Automatic Reports";
  // Workbook.lastModifiedBy = "LoneWolf Software | Automatic Reports";
  // Workbook.created = new Date(selectedDate);
  // Workbook.modified = new Date(selectedDate);

  // const ConsolidatorPivots = Workbook.addWorksheet("Consolidator Pivots");
  // const TeacherEfficiencyPivots = Workbook.addWorksheet(
  //   "Teacher Efficiency Pivots"
  // );

  // const days = Array(getDaysInMonth(selectedDate))
  //   .fill(null)
  //   .map((_, index) =>
  //     parse(
  //       `${format(selectedDate, "M")}/${index + 1}/${format(
  //         selectedDate,
  //         "yyyy"
  //       )}`,
  //       "M/d/yyyy",
  //       Date.now()
  //     )
  //   );

  // consolidatorPivotBuilder(schedules, selectedDate, ConsolidatorPivots)
  //   .then(() => {
  //     teachersEfficiencyPivotBuilder(
  //       schedules,
  //       teachers,
  //       days,
  //       TeacherEfficiencyPivots
  //     )
  //       .then(() => {
  //         Workbook.xlsx.writeBuffer().then((data) => {
  //           const blob = new Blob([data], {
  //             type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8",
  //           });
  //           saveAs(
  //             blob,
  //             "AutomaticReport-" +
  //               format(Date.now(), "yyyy-MM-dd-hh-mm-ss") +
  //               ".xlsx"
  //           );
  //         });
  //       })
  //       .catch(console.log);
  //   })
  //   .catch(console.log);
};
