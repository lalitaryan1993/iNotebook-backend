const express = require('express');
const router = express.Router();
const Notes = require('../models/Notes');
const { body, validationResult } = require('express-validator');

const fetchUser = require('../middleware/fetchUser');

// Route 1: Get all the notes using : POST "/api/notes/fetchAllNotes".  Login required.

router.get('/fetchAllNotes', fetchUser, async (req, res) => {
  try {
    const notes = await Notes.find({ user: req.user.id });
    // console.log(notes);
    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json('Internal server error');
  }
});

// Route 2: Add a new Note using : POST "/api/notes/addNote".  Login required.

router.post(
  '/addNote',
  fetchUser,
  [
    body('title').isLength({ min: 3 }).withMessage('Title must be at least 3 characters long.'),
    body('description').isLength({ min: 6 }).withMessage('Description must be at least 5 characters long'),
  ],
  async (req, res) => {
    try {
      const { title, description, tag } = req.body;

      // If there are errors, return bad request and errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const note = new Notes({
        title,
        description,
        tag,
        user: req.user.id,
      });
      const newNote = await note.save();

      res.json(newNote);
    } catch (error) {
      console.error(error);
      res.status(500).json('Internal server error');
    }
  }
);

// Route 3: Update an existing Note using : PUT "/api/notes/updateNote".  Login required.
router.put('/updateNote/:id', fetchUser, async (req, res) => {
  try {
    const { title, description, tag } = req.body;

    const newNote = {};
    if (title) newNote.title = title;
    if (description) newNote.description = description;
    if (tag) newNote.tag = tag;

    // Find the node to update and update it
    const note = await Notes.findById(req.params.id);
    if (!note) return res.status(404).json('Note not found');

    if (note.user.toString() !== req.user.id) {
      return res.status(401).json('Not authorized');
    }

    const updatedNote = await Notes.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true });
    res.json(updatedNote);
  } catch (error) {
    console.error(error);
    res.status(500).json('Internal server error');
  }
});

// Route 4: Delete an existing Note using : DELETE "/api/notes/deleteNote".  Login required.
router.delete('/deleteNote/:id', fetchUser, async (req, res) => {
  try {
    // Find the node to delete and delete it
    const note = await Notes.findById(req.params.id);
    if (!note) return res.status(404).json('Note not found');

    // Allow only the user who created the note to delete it
    if (note.user.toString() !== req.user.id) {
      return res.status(401).json('Not authorized');
    }

    const deletedNote = await Notes.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Note has been deleted successfully', deletedNote });
  } catch (error) {
    console.error(error);
    res.status(500).json('Internal server error');
  }
});

module.exports = router;
