// src/components/Step4Participants.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Step4Participants({ formData, updateFormData }) {
  const addParticipant = () => {
    updateFormData("participants", [...formData.participants, ""]);
  };

  const removeParticipant = (index) => {
    const newParticipants = formData.participants.filter((_, i) => i !== index);
    updateFormData("participants", newParticipants);
  };

  const updateParticipant = (index, value) => {
    const newParticipants = formData.participants.map((participant, i) =>
      i === index ? value : participant
    );
    updateFormData("participants", newParticipants);
  };

  return (
    <div>
      {formData.participants.map((participant, index) => (
        <div key={index} className="flex space-x-2 mb-2">
          <Input
            value={participant}
            onChange={(e) => updateParticipant(index, e.target.value)}
            placeholder="Participant name"
          />
          <Button
            onClick={() => removeParticipant(index)}
            variant="destructive"
          >
            Remove
          </Button>
        </div>
      ))}
      <Button onClick={addParticipant} className="mt-2">
        Add Participant
      </Button>
    </div>
  );
}
