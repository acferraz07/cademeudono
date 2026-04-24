import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import * as PDFDocument from 'pdfkit'
import { Request } from 'express'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateAdoptionDto } from './dto/create-adoption.dto'

@Injectable()
export class AdoptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async create(userId: string, dto: CreateAdoptionDto, request: Request) {
    if (!dto.acceptedTerm) {
      throw new BadRequestException('É obrigatório aceitar o termo de adoção responsável')
    }

    if (!this.isValidCpf(dto.cpf)) {
      throw new BadRequestException('CPF inválido')
    }

    const pet = await this.prisma.pet.findUnique({
      where: { id: dto.petId, isActive: true, isForAdoption: true, isAdopted: false },
      include: {
        owner: { select: { fullName: true, city: true, state: true } },
        breedRecord: { select: { name: true } },
      },
    })

    if (!pet) {
      throw new NotFoundException('Pet não encontrado ou não está disponível para adoção')
    }

    const cleanCpf = dto.cpf.replace(/\D/g, '')
    const cpfHash = await bcrypt.hash(cleanCpf, 12)
    const cpfMasked = this.maskCpf(cleanCpf)

    const ipAddress =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      request.socket.remoteAddress ??
      'unknown'

    const adoption = await this.prisma.adoption.create({
      data: {
        userId,
        petId: dto.petId,
        fullName: dto.fullName,
        cpfHash,
        cpfMasked,
        ipAddress,
        status: 'PENDING',
      },
    })

    // Gerar PDF de forma assíncrona e não bloqueante
    void this.generateAndUploadPdf(adoption.id, dto, pet, cpfMasked, ipAddress)

    return {
      adoptionId: adoption.id,
      status: adoption.status,
      message: 'Solicitação de adoção registrada com sucesso. O termo está sendo gerado.',
    }
  }

  async findMyAdoptions(userId: string) {
    return this.prisma.adoption.findMany({
      where: { userId },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            profilePhotoUrl: true,
            media: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string, userId: string) {
    const adoption = await this.prisma.adoption.findUnique({
      where: { id },
      include: {
        pet: {
          select: { id: true, name: true, species: true, breed: true, breedName: true },
        },
      },
    })

    if (!adoption) throw new NotFoundException('Adoção não encontrada')
    if (adoption.userId !== userId) {
      throw new BadRequestException('Acesso negado')
    }

    return adoption
  }

  private async generateAndUploadPdf(
    adoptionId: string,
    dto: CreateAdoptionDto,
    pet: { name: string; species: string; breed: string | null; breedName: string | null; sex: string | null; size: string | null; breedRecord: { name: string } | null; owner: { fullName: string; city: string | null; state: string | null } },
    cpfMasked: string,
    ipAddress: string,
  ) {
    try {
      const pdfBuffer = await this.buildPdf(dto, pet, cpfMasked, ipAddress)

      const path = `adoptions/${adoptionId}.pdf`
      const pdfUrl = await this.supabase.uploadFile('documents', path, pdfBuffer, 'application/pdf')

      await this.prisma.adoption.update({
        where: { id: adoptionId },
        data: { pdfUrl, status: 'COMPLETED' },
      })
    } catch {
      // PDF failure não deve bloquear a adoção
    }
  }

  private buildPdf(
    dto: CreateAdoptionDto,
    pet: { name: string; species: string; breed: string | null; breedName: string | null; sex: string | null; size: string | null; breedRecord: { name: string } | null; owner: { fullName: string; city: string | null; state: string | null } },
    cpfMasked: string,
    ipAddress: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 60 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const now = new Date()
      const dateStr = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      const breedDisplay = pet.breedRecord?.name ?? pet.breedName ?? pet.breed ?? 'Não informada'
      const speciesMap: Record<string, string> = { DOG: 'Cão', CAT: 'Gato', OTHER: 'Outro' }
      const speciesDisplay = speciesMap[pet.species] ?? pet.species
      const sexMap: Record<string, string> = { MALE: 'Macho', FEMALE: 'Fêmea' }
      const sexDisplay = pet.sex ? sexMap[pet.sex] ?? pet.sex : 'Não informado'
      const sizeMap: Record<string, string> = { SMALL: 'Pequeno', MEDIUM: 'Médio', LARGE: 'Grande', GIANT: 'Gigante' }
      const sizeDisplay = pet.size ? sizeMap[pet.size] ?? pet.size : 'Não informado'

      // Cabeçalho
      doc.fontSize(18).font('Helvetica-Bold').text('TERMO DE ADOÇÃO RESPONSÁVEL', { align: 'center' })
      doc.fontSize(11).font('Helvetica').text('Plataforma Cadê Meu Dono', { align: 'center' })
      doc.moveDown(0.5)
      doc.moveTo(60, doc.y).lineTo(540, doc.y).stroke()
      doc.moveDown()

      // Dados do pet
      doc.fontSize(13).font('Helvetica-Bold').text('DADOS DO ANIMAL')
      doc.moveDown(0.3)
      doc.fontSize(11).font('Helvetica')
      doc.text(`Nome: ${pet.name}`)
      doc.text(`Espécie: ${speciesDisplay}`)
      doc.text(`Raça: ${breedDisplay}`)
      doc.text(`Sexo: ${sexDisplay}`)
      doc.text(`Porte: ${sizeDisplay}`)
      doc.text(`Responsável atual: ${pet.owner.fullName}`)
      if (pet.owner.city) {
        doc.text(`Localização: ${pet.owner.city}${pet.owner.state ? ` - ${pet.owner.state}` : ''}`)
      }
      doc.moveDown()

      // Dados do adotante
      doc.fontSize(13).font('Helvetica-Bold').text('DADOS DO ADOTANTE')
      doc.moveDown(0.3)
      doc.fontSize(11).font('Helvetica')
      doc.text(`Nome completo: ${dto.fullName}`)
      doc.text(`CPF: ${cpfMasked}`)
      doc.text(`Data e hora: ${dateStr}`)
      doc.text(`Endereço IP: ${ipAddress}`)
      doc.moveDown()

      // Termo
      doc.fontSize(13).font('Helvetica-Bold').text('TERMO DE RESPONSABILIDADE')
      doc.moveDown(0.3)
      doc.fontSize(10).font('Helvetica')
      const termText = [
        `Pelo presente instrumento, eu, ${dto.fullName}, portador(a) do CPF nº ${cpfMasked}, declaro para os devidos fins que:`,
        '',
        '1. Estou adotando voluntariamente o animal identificado acima, cadastrado na plataforma Cadê Meu Dono.',
        '',
        '2. Me comprometo a oferecer ao animal moradia adequada, alimentação suficiente, cuidados veterinários necessários e tratamento digno e respeitoso.',
        '',
        '3. Não utilizarei o animal para fins de maus-tratos, abandono, venda, experimentação ou quaisquer atividades que comprometam seu bem-estar físico ou psicológico.',
        '',
        '4. Estou ciente de que o abandono de animais domésticos é crime previsto na Lei Federal nº 9.605/98 (Lei de Crimes Ambientais), sujeito a pena de detenção de seis meses a um ano e multa.',
        '',
        '5. Autorizo eventuais visitas de acompanhamento ao animal quando solicitado pelo responsável pela adoção.',
        '',
        '6. Declaro ter lido e concordado integralmente com os termos acima, sob pena de responsabilização civil e criminal.',
      ]

      termText.forEach((line) => doc.text(line))
      doc.moveDown()

      // Assinatura digital
      doc.moveTo(60, doc.y).lineTo(540, doc.y).stroke()
      doc.moveDown(0.5)
      doc.fontSize(11).font('Helvetica')
      doc.text(`Assinatura digital: ${dto.fullName}`)
      doc.text(`CPF: ${cpfMasked}`)
      doc.text(`Data/Hora: ${dateStr}`)
      doc.moveDown(2)
      doc.fontSize(9).fillColor('gray').text(
        'Este documento foi gerado eletronicamente pela plataforma Cadê Meu Dono. ' +
          'Possui validade legal como comprovante de adoção responsável.',
        { align: 'center' },
      )

      doc.end()
    })
  }

  private isValidCpf(cpf: string): boolean {
    const clean = cpf.replace(/\D/g, '')
    if (clean.length !== 11) return false
    if (/^(\d)\1{10}$/.test(clean)) return false

    let sum = 0
    for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i)
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(clean[9])) return false

    sum = 0
    for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i)
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    return remainder === parseInt(clean[10])
  }

  private maskCpf(cleanCpf: string): string {
    return `${cleanCpf.slice(0, 3)}.***.***-${cleanCpf.slice(-2)}`
  }
}
