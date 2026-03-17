import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('credit_card_limits')
        .select('*')
        .eq('user_id', user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map snake_case to camelCase
    const mappedLimits = data.map(limit => ({
        id: limit.id,
        userId: limit.user_id,
        bankName: limit.bank_name,
        limitAmount: limit.limit_amount,
        dueDay: limit.due_day,
        createdAt: limit.created_at,
        updatedAt: limit.updated_at
    }))

    return NextResponse.json(mappedLimits)
}

export async function POST(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bankName, limitAmount, dueDay } = body

    if (!bankName || limitAmount === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert: update if exists, insert if not
    const { data, error } = await supabase
        .from('credit_card_limits')
        .upsert({
            user_id: user.id,
            bank_name: bankName,
            limit_amount: limitAmount,
            due_day: dueDay,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,bank_name'
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back to camelCase
    const mappedResponse = {
        id: data.id,
        userId: data.user_id,
        bankName: data.bank_name,
        limitAmount: data.limit_amount,
        dueDay: data.due_day,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    }

    return NextResponse.json(mappedResponse)
}
