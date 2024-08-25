"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Comments from "@/components/Comments";

// Interface definitions
interface Comment {
  id: string;
  text: string;
  attachments: string[]; // URLs of uploaded files
}

interface Transcription {
  id: string;
  audio_url: string;
  text: string;
  comments: Comment[];
}

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function Home() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Transcription | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState("");
  const [currentAttachments, setCurrentAttachments] = useState<File[]>([]);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isListening) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch("http://localhost:5000/transcriptions"); // Local backend URL
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const data: Transcription[] = await response.json();
          setTranscriptions(data);
        } catch (error) {
          console.error("Error fetching transcriptions:", error);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isListening]);

  const startListening = async () => {
    try {
      setIsListening(true);
      const response = await fetch("http://localhost:5000/startListening"); // Local backend URL
      if (!response.ok) {
        throw new Error("Failed to start listening");
      }
    } catch (error) {
      console.error("Error starting listening:", error);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      const response = await fetch("http://localhost:5000/stopListening"); // Local backend URL
      if (!response.ok) {
        throw new Error("Failed to stop listening");
      }
    } catch (error) {
      console.error("Error stopping listening:", error);
    }
  };

  const handleSegmentClick = (transcription: Transcription) => {
    setSelectedSegment(transcription);
    setIsCommentModalOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setCurrentAttachments(Array.from(event.target.files));
    }
  };

  const handleSaveComment = async () => {
    if (selectedSegment) {
      const formData = new FormData();
      formData.append("text", currentComment);
      currentAttachments.forEach((file) => {
        formData.append("attachments", file);
      });

      try {
        const response = await fetch(`https://riz3ap1tx8.execute-api.ap-south-1.amazonaws.com/${selectedSegment.id}/comments`, {
          method: editingComment ? "PUT" : "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to save comment");
        }

        const updatedComment = await response.json();

        if (editingComment) {
          const updatedComments = selectedSegment.comments.map((comment) =>
            comment.id === editingComment.id ? updatedComment : comment
          );
          selectedSegment.comments = updatedComments;
        } else {
          selectedSegment.comments.push(updatedComment);
        }

        setSelectedSegment({ ...selectedSegment });
        setEditingComment(null);
        setIsCommentModalOpen(false);
        setCurrentComment("");
        setCurrentAttachments([]);
      } catch (error) {
        console.error("Error saving comment:", error);
      }
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setCurrentComment(comment.text);
    setCurrentAttachments([]); // Reset attachments when editing
    setIsCommentModalOpen(true);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (selectedSegment) {
      try {
        const response = await fetch(`https://riz3ap1tx8.execute-api.ap-south-1.amazonaws.com/${selectedSegment.id}/comments/${commentId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete comment");
        }

        selectedSegment.comments = selectedSegment.comments.filter((comment) => comment.id !== commentId);
        setSelectedSegment({ ...selectedSegment });
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    }
  };

  return (
    <div className=" flex flex-col items-center justify-center bg-gray-100 my-2 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Real-Time Speech Transcription</h1>
      <div className="flex gap-4">
        <button
          className={`px-4 py-2 mb-4 text-white rounded font-medium ${
            isListening ? "bg-red-500" : "bg-blue-500"
          }`}
          onClick={startListening}
          disabled={isListening}
        >
          {isListening ? "Listening..." : "Start Listening"}
        </button>
        <button
          className="px-4 py-2 mb-4 text-white bg-gray-500 rounded"
          onClick={stopListening}
          disabled={!isListening}
        >
          Stop Listening
        </button>
      </div>
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Transcriptions:</h2>
        <ul className="bg-white p-4 rounded shadow-md">
        {transcriptions.map((transcription, index) => (
  <li
    key={index}
    className="mb-4 cursor-pointer"
    onClick={() => handleSegmentClick(transcription)}
  >
    <h3 className="font-semibold mb-2 text-blue-600">Conversation {index + 1}:</h3>
    <p className="mb-2">Transcription: {transcription.text}</p>
    <audio controls>
      <source src={transcription.audio_url} type="audio/mpeg" />
      <source src={transcription.audio_url} type="audio/ogg" />
      Your browser does not support the audio element.
    </audio>
    {/* Display comments for this segment */}
    <Comments
  comments={transcription.comments || []} // Ensure comments is always an array
  onEdit={handleEditComment}
  onDelete={handleDeleteComment}
/>

  </li>
))}

        </ul>
      </div>

      <Modal
        open={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            {editingComment ? "Edit Comment" : "Add a Comment"}
          </Typography>
          <textarea
            value={currentComment}
            onChange={(e) => setCurrentComment(e.target.value)}
            className="w-full p-2 mt-2 border border-gray-300 rounded text-black font-medium"
            placeholder="Add your comment here..."
          />
          <input type="file" onChange={handleFileChange} multiple className="mt-4" />
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSaveComment}>{editingComment ? "Save Changes" : "Add Comment"}</Button>
            <Button onClick={() => setIsCommentModalOpen(false)}>Cancel</Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
