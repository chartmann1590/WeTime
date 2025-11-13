import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const settingsSchema = z.object({
  ollamaUrl: z.string().url('Invalid URL format'),
  selectedModel: z.string().optional(),
  useCpu: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.aiAssistantSetting.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      return NextResponse.json({
        ollamaUrl: '',
        selectedModel: null,
        useCpu: false,
      });
    }

    return NextResponse.json({
      ollamaUrl: settings.ollamaUrl,
      selectedModel: settings.selectedModel,
      useCpu: settings.useCpu || false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settings = await prisma.aiAssistantSetting.upsert({
      where: { userId: user.id },
      update: {
        ollamaUrl: parsed.data.ollamaUrl,
        selectedModel: parsed.data.selectedModel || null,
        useCpu: parsed.data.useCpu ?? false,
      },
      create: {
        userId: user.id,
        ollamaUrl: parsed.data.ollamaUrl,
        selectedModel: parsed.data.selectedModel || null,
        useCpu: parsed.data.useCpu ?? false,
      },
    });

    return NextResponse.json({
      ollamaUrl: settings.ollamaUrl,
      selectedModel: settings.selectedModel,
      useCpu: settings.useCpu,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}

