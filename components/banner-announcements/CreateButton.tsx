"use client";

import { Button } from "../ui/button"
import { PackagePlus } from "lucide-react"
import { useState } from "react";
import ModalPopupYesOrNo from "../technical-components/Modals/ModalPopupYesOrNo";

const CreateButton = () => {
const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  return (
    <>
        <Button variant={"red_default"} className="" onClick={() => setShowCreateAnnouncementModal(true)}>
            <PackagePlus/> Create
        </Button>

        <ModalPopupYesOrNo
            open={showCreateAnnouncementModal}
            onOpenChange={setShowCreateAnnouncementModal}
        />
    </>

  )
}

export default CreateButton
