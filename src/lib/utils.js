import { clsx } from "clsx";
import { compareAsc, format, getDaysInMonth, parse } from "date-fns";
import ExcelJS from "exceljs";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";
import { useWorker } from "../hooks/useWorker";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getReadableFileSizeString(fileSizeInBytes) {
  var i = -1;
  var byteUnits = [" kB", " MB", " GB", " TB", "PB", "EB", "ZB", "YB"];
  do {
    fileSizeInBytes /= 1024;
    i++;
  } while (fileSizeInBytes > 1024);

  return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
}

export const sortBy = (rows, categories = []) => {
  return categories.length > 0
    ? rows.sort((a, b) => {
        const aCategorified = categories
          .map((category) =>
            category === "Date" || category === "Time"
              ? category === "Date"
                ? compareAsc(
                    parse(a[category], "M-d-yyyy", Date.now()),
                    parse(b[category], "M-d-yyyy", Date.now())
                  )
                : compareAsc(
                    parse(a[category], "h:mm a", Date.now()),
                    parse(b[category], "h:mm a", Date.now())
                  )
              : a[category]
          )
          .join("");
        const bCategorified = categories
          .map((category) =>
            category === "Date" || category === "Time"
              ? category === "Date"
                ? compareAsc(
                    parse(b[category], "M-d-yyyy", Date.now()),
                    parse(a[category], "M-d-yyyy", Date.now())
                  )
                : compareAsc(
                    parse(b[category], "h:mm a", Date.now()),
                    parse(a[category], "h:mm a", Date.now())
                  )
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
            parse(a["Date"], "M-d-yyyy", Date.now()),
            parse(b["Date"], "M-d-yyyy", Date.now())
          ) +
            a["Name"] +
            compareAsc(
              parse(a["Time"], "h:mm a", Date.now()),
              parse(b["Time"], "h:mm a", Date.now())
            ) >
          compareAsc(
            parse(b["Date"], "M-d-yyyy", Date.now()),
            parse(a["Date"], "M-d-yyyy", Date.now())
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
            parse(a["Date"], "M-d-yyyy", Date.now()),
            parse(b["Date"], "M-d-yyyy", Date.now())
          ) +
            a["Name"] +
            compareAsc(
              parse(a["Time"], "h:mm a", Date.now()),
              parse(b["Time"], "h:mm a", Date.now())
            ) <
          compareAsc(
            parse(b["Date"], "M-d-yyyy", Date.now()),
            parse(a["Date"], "M-d-yyyy", Date.now())
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
  useWorker(
    "invoicingRowProcessorWorker",
    { data, selectedDay },
    (response) => {
      const { type, data } = response;

      switch (type) {
        case "progress":
          onProgress(data);
          break;
        case "message":
          onEvent(data);
          break;
        case "data":
          onEvent("Processing complete.");

          onComplete(data);
          break;
      }
    }
  );
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

export const consolidatedSheet = async (data) => {
  const workbook = XLSX.utils.book_new();

  data.map((groupData) => {
    const groupName = groupData[0]["ShiftGroup"];

    let GroupPivots = [];

    let headerRow = ["Tutor", "Scheduled", "Picked Up", "Dropped"];
    let bodyRows = [];
    let footerRow = ["Total"];

    let teacherNames = [];

    const groupDataFixed = groupData.map((groupData) => {
      delete groupData["ShiftGroup"];

      teacherNames = [...new Set([...teacherNames, groupData["Name"]])];

      return groupData;
    });

    const worksheet = XLSX.utils.json_to_sheet(groupDataFixed);

    teacherNames.map((teacherName) => {
      const teacherSchedules = groupDataFixed.filter(
        (schedule) => schedule["Name"] === teacherName
      );

      const pickedUpSchedules = teacherSchedules.filter(
        (schedule) =>
          schedule["ShiftType"] === "Pickup" ||
          schedule["ShiftType"] === "Internal Pickup"
      );

      const droppedSchedules = teacherSchedules.filter(
        (schedule) =>
          schedule["ShiftType"] === "Dropped" ||
          schedule["ShiftType"] === "Dropped & Picked Up"
      );

      bodyRows.push([
        teacherName,
        teacherSchedules.length,
        pickedUpSchedules.length,
        droppedSchedules.length,
      ]);
    });

    let totalScheduled = 0;
    let totalPickedUp = 0;
    let totalDropped = 0;

    bodyRows.map((bodyRow) => {
      totalScheduled += bodyRow[1];
      totalPickedUp += bodyRow[2];
      totalDropped += bodyRow[3];
    });

    footerRow.push(totalScheduled);
    footerRow.push(totalPickedUp);
    footerRow.push(totalDropped);

    GroupPivots = [headerRow, ...bodyRows, footerRow];

    XLSX.utils.sheet_add_aoa(worksheet, GroupPivots, { origin: "H1" });

    XLSX.utils.book_append_sheet(workbook, worksheet, groupName);
  });

  await XLSX.writeFile(
    workbook,
    "AutomaticReport-Consolidated-Groups-" +
      format(Date.now(), "yyyy-MM-dd-hh-mm-ss") +
      ".xlsx",
    { cellStyles: true, bookType: "xlsx" }
  );
};

export const exportEfficiencyTables = async (data) => {
  const workbook = XLSX.utils.book_new();

  data.map((groupData) => {
    const worksheet = XLSX.utils.aoa_to_sheet(groupData[1]);

    XLSX.utils.book_append_sheet(workbook, worksheet, groupData[0]);
  });

  await XLSX.writeFile(
    workbook,
    "AutomaticReport-Group-Efficencies-" +
      format(Date.now(), "yyyy-MM-dd-hh-mm-ss") +
      ".xlsx",
    { cellStyles: true, bookType: "xlsx" }
  );
};
