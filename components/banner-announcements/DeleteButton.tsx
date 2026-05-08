"use client";

import { Button } from "../ui/button"
import ModalPopupYesOrNo from "../technical-components/Modals/ModalPopupYesOrNo"
import { useState } from "react";

const DeleteButton = () => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    return (
        <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(true)}>
                Delete
            </Button>
        
            <ModalPopupYesOrNo
            open={showDeleteModal}
            onOpenChange={setShowDeleteModal}
            // optionally pass onConfirm={() => { delete logic; setShowDeleteModal(false); }}
        />
      </>
    )
}

export default DeleteButton
