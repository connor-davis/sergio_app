onmessage = (event) => {
  const { rows, categories } = event.data;

  postMessage(
    categories.length > 0
      ? rows.sort((a, b) => {
          const aCategorified = categories
            .map((category) => a[category])
            .join("-");
          const bCategorified = categories
            .map((category) => b[category])
            .join("-");

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
        })
  );
};
