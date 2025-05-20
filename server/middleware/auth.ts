import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    const path = event.path || event.node.req.url || "";

    if (path.includes("/api/auth/login") || !path.includes("/api/")) {
      return;
    }

    const authHeader = event.node.req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      setResponseStatus(event, 401);
      return {
        message: "Unauthorized",
        error: true,
      };
    }

    const token = authHeader.split(" ")[1];
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      setResponseStatus(event, 500);
      return {
        message: "Internal server error",
        error: true,
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      setResponseStatus(event, 401);
      return {
        message: "Invalid token",
        error: true,
      };
    }

    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("uuid", data.user.id)
      .single();

    if (!userData) {
      setResponseStatus(event, 404);
      return {
        message: "User not found",
        error: true,
      };
    }

    if (userError) {
      setResponseStatus(event, 500);
      return {
        message: "Failed to fetch user data",
        error: true,
      };
    }

    event.context.user = {
      uuid: userData.uuid,
      email: userData.email,
      role: userData.role,
      user: data.user,
    };
    return;
  } catch (error) {
    setResponseStatus(event, 401);
    return {
      message: "Authentication failed",
      error: true,
    };
  }
});
