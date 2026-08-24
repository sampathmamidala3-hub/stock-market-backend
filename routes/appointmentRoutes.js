const express = require("express");
const router = express.Router();

const Appointment = require("../models/appointment");

router.post("/", async (req, res) => {
  try {
    const { name, phone, email, date, service, message } = req.body;

    if (!name || !phone || !date || !service) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const appointment = new Appointment({
      name,
      phone,
      email,
      date,
      service,
      message,
    });

    const savedAppointment = await appointment.save();

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: savedAppointment,
    });
  } catch (error) {
    console.error("Appointment error:", error);

    res.status(500).json({
      message: "Failed to book appointment",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      createdAt: -1,
    });

    res.json(appointments);
  } catch (error) {
    console.error("Get appointments error:", error);

    res.status(500).json({
      message: "Failed to get appointments",
      error: error.message,
    });
  }
});

module.exports = router;