import { RoomShell } from "@sqlrooms/room-shell";
import { SqlEditorModal } from "@sqlrooms/sql-editor";
import { ThemeProvider, ThemeSwitch, useDisclosure } from "@sqlrooms/ui";
import { TerminalIcon } from "lucide-react";
import { roomStore } from "@/store";

export function App() {
  const sqlEditorDisclosure = useDisclosure();

  return (
    <>
      <ThemeProvider defaultTheme="light" storageKey="sqlrooms-ui-theme">
        <RoomShell className="h-screen" roomStore={roomStore}>
          <RoomShell.Sidebar className="gap-2">
            <RoomShell.SidebarButton
              title="SQL Editor"
              onClick={sqlEditorDisclosure.onToggle}
              isSelected={false}
              icon={TerminalIcon}
            />
            <ThemeSwitch />
          </RoomShell.Sidebar>
          <RoomShell.LayoutComposer />
          <RoomShell.LoadingProgress />
          <SqlEditorModal
            isOpen={sqlEditorDisclosure.isOpen}
            onClose={sqlEditorDisclosure.onClose}
          />
        </RoomShell>
      </ThemeProvider>
    </>
  );
}

export default App;
