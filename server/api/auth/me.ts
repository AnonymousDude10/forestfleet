export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;

    if (!user) {
      setResponseStatus(event, 401);
      return {
        message: "Unauthorized",
        error: true,
      };
    }

    return {
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    setResponseStatus(event, 500);
    return {
      message: "An internal error occurred",
      error: true,
    };
  }
});
