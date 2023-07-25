import { LayoutDashboard, ListTree, Users2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { FileArchive } from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <Card className="hidden md:block md:w-[300px] h-full border-t-0 border-b-0 border-l-0 shadow-none rounded-none">
      <CardContent className="w-full p-1">
        {/* <Button
          className="justify-start w-full"
          variant="ghost"
          onClick={() => navigate("/")}
        >
          <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
        </Button>
        <Button
          className="justify-start w-full"
          variant="ghost"
          onClick={() => navigate("/teachers")}
        >
          <Users2 className="w-4 h-4 mr-2" /> Teachers
        </Button> */}
        <Button
          className="justify-start w-full"
          variant="ghost"
          onClick={() => navigate("/")}
        >
          <ListTree className="w-4 h-4 mr-2" /> Shift Schedule
        </Button>
        <Button
          className="justify-start w-full"
          variant="ghost"
          onClick={() => navigate("/teachers")}
        >
          <Users2 className="w-4 h-4 mr-2" /> Teachers
        </Button>
        <Button
          className="justify-start w-full"
          variant="ghost"
          onClick={() => navigate("/file-archive")}
        >
          <FileArchive className="w-4 h-4 mr-2" /> Archive
        </Button>
      </CardContent>
    </Card>
  );
};

export default Sidebar;
