const prettyRows = (rows) => {
  return rows.map((row) => ({
    style: row["style"],
    worksheet: row["_worksheet"]["name"],
    cells: row["_cells"].splice(1, row["_cells"].length - 2).map((cell) => ({
      value: cell["_value"]["model"]["value"],
    })),
  }));
};

onmessage = (event) => {
  let groupBackIndex = 0;
  let nameBackIndex = 0;

  let rows = prettyRows(event.data.rows);

  rows = rows.map((row, index) => {
    if (!row["cells"][0]["value"]) groupBackIndex--;
    else groupBackIndex = 0;

    if (!row["cells"][1]["value"]) nameBackIndex--;
    else nameBackIndex = 0;

    let ShiftGroup = rows[index + groupBackIndex]["cells"][0]["value"];
    const Name = rows[index + nameBackIndex]["cells"][1]["value"];
    const Date = row["cells"][5]["value"];
    const Shift = row["cells"][6]["value"];

    if (ShiftGroup.split(" ")[0] === "Rotation") ShiftGroup = "Rotation";

    postMessage({
      type: "message",
      data: `Processed ${index + 1}/${rows.length} rows.`,
    });
    postMessage({
      type: "progress",
      data: Math.ceil(((index + 1) / rows.length) * 100),
    });

    return {
      ShiftGroup,
      Name,
      Date,
      Shift,
    };
  });

  postMessage({
    type: "data",
    data: rows,
  });
};
