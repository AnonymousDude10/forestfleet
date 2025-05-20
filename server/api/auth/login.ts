import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    const IP =
      event.node.req.headers["x-forwarded-for"] ||
      event.node.req.socket.remoteAddress;
    const body = await readBody(event);
    if (!body) {
      setResponseStatus(event, 422);
      return {
        message: "Request body is required",
        error: true,
      };
    }

    if (!body.email || !body.password) {
      setResponseStatus(event, 422);
      return {
        message: "Email and password are required",
        error: true,
      };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      setResponseStatus(event, 500);
      return {
        message: "Supabase URL and Service Key are required",
        error: true,
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: signins } = await supabase
      .from("signins")
      .select("*")
      .eq("ip", IP)
      .eq("email", body.email)
      .order("timestamp", { ascending: false })
      .limit(10);

    const now = new Date();
    const lockoutTime = 30 * 60 * 1000;
    const failedAttempts =
      signins?.filter((signin) => {
        const timestamp = new Date(signin.timestamp);
        return (
          signin.failed === true &&
          now.getTime() - timestamp.getTime() < lockoutTime
        );
      }).length || 0;

    if (failedAttempts >= 5) {
      // Don't provide too much information about the error
      // to prevent brute-force attacks
      setResponseStatus(event, 429);
      return {
        message: "Too many requests",
        error: true,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      await supabase.from("signins").insert({
        email: body.email,
        failed: true,
        ip: IP,
      });

      const newFailedCount = failedAttempts + 1;

      if (newFailedCount >= 5) {
        // Don't provide too much information about the error
        // to prevent brute-force attacks
        setResponseStatus(event, 429);
        return {
          message: "Too many requests",
          error: true,
        };
      }

      setResponseStatus(event, 401);
      return {
        message: error.message,
        error: true,
      };
    }

    await supabase.from("signins").insert({
      email: body.email,
      failed: false,
      ip: IP,
    });

    const { user, session } = data;
    return {
      uuid: user.id,
      email: user.email,
      token: `Bearer ${session.access_token}`, // Note that role is not included in the JWT
    };
  } catch (error) {
    setResponseStatus(event, 500);
    return {
      message: "An Internal error occurred",
      error: true,
    };
  }
});
