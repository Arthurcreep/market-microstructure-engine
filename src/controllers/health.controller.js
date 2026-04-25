const getHealth = async (req, res, next) => {
  try {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHealth };