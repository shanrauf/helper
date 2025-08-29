import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { subDays } from "date-fns";
import { and, count, eq, gte, inArray, isNotNull, isNull, SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { conversationMessages, conversations, mailboxes, userProfiles } from "@/db/schema";
import { triggerEvent } from "@/jobs/trigger";
import { getGuideSessionsForMailbox } from "@/lib/data/guide";
import { getMailboxInfo } from "@/lib/data/mailbox";
import { conversationsRouter } from "./conversations/index";
import { customersRouter } from "./customers";
import { faqsRouter } from "./faqs";
import { githubRouter } from "./github";
import { issueGroupsRouter } from "./issueGroups";
import { membersRouter } from "./members";
import { metadataEndpointRouter } from "./metadataEndpoint";
import { mailboxProcedure } from "./procedure";
import { savedRepliesRouter } from "./savedReplies";
import { slackRouter } from "./slack";
import { toolsRouter } from "./tools";
import { websitesRouter } from "./websites";

export { mailboxProcedure };

export const mailboxRouter = {
  openCount: mailboxProcedure.query(async ({ ctx }) => {
    const countOpenStatus = async (where?: SQL) => {
      const result = await db
        .select({ count: count() })
        .from(conversations)
        .where(and(eq(conversations.status, "open"), isNull(conversations.mergedIntoId), where));
      return result[0]?.count ?? 0;
    };

    const [all, mine, assigned] = await Promise.all([
      countOpenStatus(),
      countOpenStatus(eq(conversations.assignedToId, ctx.user.id)),
      countOpenStatus(isNotNull(conversations.assignedToId)),
    ]);

    return {
      all,
      mine,
      assigned,
      unassigned: all - assigned,
    };
  }),
  get: mailboxProcedure.query(async ({ ctx }) => {
    return await getMailboxInfo(ctx.mailbox);
  }),
  update: mailboxProcedure
    .input(
      z.object({
        slackAlertChannel: z.string().nullable().optional(),
        githubRepoOwner: z.string().optional(),
        githubRepoName: z.string().optional(),
        widgetDisplayMode: z.enum(["off", "always", "revenue_based"]).optional(),
        widgetDisplayMinValue: z.number().nullable().optional(),
        widgetHost: z.string().nullable().optional(),
        vipThreshold: z.number().nullable().optional(),
        vipChannelId: z.string().nullable().optional(),
        vipExpectedResponseHours: z.number().nullable().optional(),
        autoCloseEnabled: z.boolean().optional(),
        autoCloseDaysOfInactivity: z.number().optional(),
        name: z.string().optional(),
        preferences: z
          .object({
            confetti: z.boolean().optional(),
            autoRespondEmailToChat: z.enum(["draft", "reply"]).nullable().optional(),
            disableTicketResponseTimeAlerts: z.boolean().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const preferences = { ...ctx.mailbox.preferences, ...(input.preferences ?? {}) };
      await db
        .update(mailboxes)
        .set({ ...input, preferences })
        .where(eq(mailboxes.id, ctx.mailbox.id));
    }),

  getSessionsPaginated: mailboxProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const { limit, cursor } = input;
      const page = cursor || 1;

      const result = await getGuideSessionsForMailbox(page, limit);
      const sessions = Array.isArray(result?.sessions) ? result.sessions : [];
      const totalCount = result?.totalCount ?? 0;

      const nextCursor = sessions.length === limit ? page + 1 : null;

      return {
        items: sessions,
        totalCount,
        nextCursor,
      };
    }),
  conversations: conversationsRouter,
  faqs: faqsRouter,
  members: membersRouter,
  slack: slackRouter,
  github: githubRouter,
  tools: toolsRouter,
  customers: customersRouter,
  websites: websitesRouter,
  metadataEndpoint: metadataEndpointRouter,
  savedReplies: savedRepliesRouter,
  issueGroups: issueGroupsRouter,

  autoClose: mailboxProcedure.mutation(async ({ ctx }) => {
    if (!ctx.mailbox.autoCloseEnabled) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Auto-close is not enabled for this mailbox",
      });
    }

    await triggerEvent("conversations/auto-close.check", {});

    return {
      success: true,
      message: "Auto-close job triggered successfully",
    };
  }),

  leaderboard: mailboxProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(7),
      }),
    )
    .query(async ({ input }) => {
      const staffReplyAnalyticsByUser = await db
        .select({
          userId: conversationMessages.userId,
          count: count(),
        })
        .from(conversationMessages)
        .where(
          and(
            eq(conversationMessages.role, "staff"),
            isNotNull(conversationMessages.userId),
            gte(conversationMessages.createdAt, subDays(new Date(), input.days)),
            isNull(conversationMessages.deletedAt),
          ),
        )
        .groupBy(conversationMessages.userId);

      const users = await db.query.userProfiles.findMany({
        where: inArray(
          userProfiles.id,
          staffReplyAnalyticsByUser.flatMap((r) => (r.userId ? [r.userId] : [])),
        ),
        with: {
          user: {
            columns: { email: true },
          },
        },
      });

      const leaderboard = staffReplyAnalyticsByUser
        .map((staffReplyAnalytics) => {
          const { user, displayName } = users.find((u) => u.id === staffReplyAnalytics.userId) ?? {};
          return {
            userId: staffReplyAnalytics.userId,
            displayName: displayName || user?.email || "Unknown",
            email: user?.email,
            replyCount: staffReplyAnalytics.count,
          };
        })
        .sort((a, b) => b.replyCount - a.replyCount);

      return { leaderboard };
    }),
} satisfies TRPCRouterRecord;
