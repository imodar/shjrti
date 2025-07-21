import { useState, useEffect } from "react";

interface ModernFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memberData: any) => void;
  familyId: string;
}

export const ModernFamilyMemberModal = ({ isOpen, onClose, onSubmit, familyId }: ModernFamilyMemberModalProps) => {
  console.log('🔥 ModernFamilyMemberModal render - isOpen:', isOpen, 'familyId:', familyId);

  const handleClose = () => {
    console.log('🔥 Debug modal close called');
    onClose();
  };

  if (!isOpen) {
    console.log('🔥 Modal not open, returning null');
    return null;
  }

  console.log('🔥 MODAL SHOULD BE VISIBLE NOW!');

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-center text-red-600">
          🔥 DEBUG MODAL WORKING! 🔥
        </h2>
        <div className="space-y-2 mb-6">
          <p><strong>isOpen:</strong> {String(isOpen)}</p>
          <p><strong>familyId:</strong> {familyId}</p>
          <p><strong>Timestamp:</strong> {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Close Modal
          </button>
          <button 
            onClick={() => {
              console.log('🔥 Test submit clicked');
              onSubmit({ name: 'Test Member', gender: 'male' });
              handleClose();
            }}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Test Submit
          </button>
        </div>
      </div>
    </div>
  );
};