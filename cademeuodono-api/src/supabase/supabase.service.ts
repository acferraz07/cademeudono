import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient
  private readonly adminClient: SupabaseClient

  constructor(private readonly config: ConfigService) {
    this.client = createClient(
      config.getOrThrow<string>('supabase.url'),
      config.getOrThrow<string>('supabase.anonKey'),
    )

    this.adminClient = createClient(
      config.getOrThrow<string>('supabase.url'),
      config.getOrThrow<string>('supabase.serviceRoleKey'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }

  signUp(params: Parameters<SupabaseClient['auth']['signUp']>[0]) {
    return this.client.auth.signUp(params)
  }

  signInWithPassword(params: Parameters<SupabaseClient['auth']['signInWithPassword']>[0]) {
    return this.client.auth.signInWithPassword(params)
  }

  getUser(token: string) {
    return this.client.auth.getUser(token)
  }

  refreshSession(params: Parameters<SupabaseClient['auth']['refreshSession']>[0]) {
    return this.client.auth.refreshSession(params)
  }

  resetPasswordForEmail(
    email: string,
    options?: Parameters<SupabaseClient['auth']['resetPasswordForEmail']>[1],
  ) {
    return this.client.auth.resetPasswordForEmail(email, options)
  }

  /** Faz upload de um arquivo para um bucket do Supabase Storage e retorna a URL pública */
  async uploadFile(bucket: string, path: string, buffer: Buffer, mimetype: string): Promise<string> {
    const { error } = await this.adminClient.storage
      .from(bucket)
      .upload(path, buffer, { contentType: mimetype, upsert: true })

    if (error) {
      throw new InternalServerErrorException(
        `Falha no upload para bucket "${bucket}": ${error.message}`,
      )
    }

    const { data } = this.adminClient.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  /** Admin auth — operações privilegiadas */
  get admin() {
    return this.adminClient.auth.admin
  }
}
