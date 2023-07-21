import { clsx } from "clsx";
import { compareAsc, format, parse } from "date-fns";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

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

export const processData = (
  data,
  onEvent = (message) => {},
  onComplete = (data) => {}
) => {
  let schedules = [];
  let shifts = [];
  let teachers = [];

  try {
    onEvent("Back indexing empty names.");

    let backIndex = 0;

    schedules = data.map((row, currentIndex) => {
      if (row["Name"] === "" || row["Name"] === undefined) backIndex -= 1;
      else backIndex = 0;

      return {
        ...row,
        Name: data[currentIndex + backIndex]["Name"],
        Time: row["Time"],
        Date: row["Date"],
        Day: format(parse(row["Date"], "M/d/yyyy", Date.now()), "d"),
      };
    });
  } catch (error) {
    onEvent(error);

    return {};
  } finally {
    try {
      onEvent("Sorting data.");

      schedules = sortByDayNameTime(schedules);
    } catch (error) {
      onEvent(error);

      return {};
    } finally {
      try {
        onEvent("Processing shifts.");

        shifts = schedules.map((schedule) => {
          return {
            Name: schedule["Name"],
            Shift: schedule["Shift"],
            Date: schedule["Date"],
            Time: schedule["Time"],
          };
        });
      } catch (error) {
        onEvent(error);

        return {};
      } finally {
        onEvent("Processing teachers.");

        teachers = [...new Set(schedules.map((schedule) => schedule["Name"]))];

        onComplete(schedules, shifts, teachers);
      }
    }
  }
};

export const consolidateData = (
  previousDataset,
  currentDataset,
  onEvent = (message) => {},
  onProgress = (progress) => {},
  onComplete = (data) => {}
) => {
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

  const pickedUpShifts = currentDataset
    .filter((data) => previousShiftTeachers[data["Shift"]] !== data["Name"])
    .map((data) => data["Shift"]);

  onComplete(
    currentDataset.map((data) => {
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
    previousDataset.filter((data) => lostShifts.includes(data["Shift"]))
  );
};

export const exportSchedules = (schedules) => {
  const worksheet = XLSX.utils.json_to_sheet(schedules);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  XLSX.writeFile(
    workbook,
    "AutomaticReport-" + format(Date.now(), "yyyy-MM-dd-hh-mm-ss") + ".xlsx"
  );
};
