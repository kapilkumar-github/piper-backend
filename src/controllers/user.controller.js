export const getUser = (req, res) => {
  const userId = req.params.id;

  return res.json({
    id: userId,
    name: "Mock User",
  });
};
