import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map snake_case to camelCase
    const mappedExpenses = data.map(expense => ({
        id: expense.id,
        date: expense.date,
        category: expense.category,
        amount: expense.amount,
        type: expense.type,
        paid: expense.paid,
        created_at: expense.created_at
    }))

    return NextResponse.json(mappedExpenses)
}

export async function POST(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Map camelCase to snake_case
    const dbPayload = {
        user_id: user.id,
        date: body.date,
        category: body.category,
        amount: body.amount,
        type: 'fixed', // Mandatory field in setup.sql
        paid: false
    }

    const { data, error } = await supabase
        .from('fixed_expenses')
        .insert([dbPayload])
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back to camelCase
    const mappedResponse = {
        id: data.id,
        date: data.date,
        category: data.category,
        amount: data.amount,
        type: data.type,
        paid: data.paid
    }

    return NextResponse.json(mappedResponse)
}

export async function PUT(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    // Map camelCase to snake_case
    const dbPayload: any = {}
    if (updateData.date !== undefined) dbPayload.date = updateData.date
    if (updateData.category !== undefined) dbPayload.category = updateData.category
    if (updateData.amount !== undefined) dbPayload.amount = updateData.amount
    if (updateData.paid !== undefined) dbPayload.paid = updateData.paid

    const { data, error } = await supabase
        .from('fixed_expenses')
        .update(dbPayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back to camelCase
    const mappedResponse = {
        id: data.id,
        date: data.date,
        category: data.category,
        amount: data.amount,
        type: data.type,
        paid: data.paid
    }

    return NextResponse.json(mappedResponse)
}

export async function DELETE(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
        .from('fixed_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
