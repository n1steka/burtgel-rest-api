import { BaseModel } from './baseModel.js'
import { _env } from '../utils/helpers.js'
import QpayApi from '../utils/external-api/qpayApi.js'

class QpayModel extends BaseModel {
	table = 'qpay'

	/**
	 * QPay үүсгэх хүсэлт илгээнэ.
	 * Ажилттай үүсвэл хадгална.
	 * @param {Invoice} invoice
	 * @returns qpay row.
	 */
	async create(invoice) {
    // QPay 1% nemj tootsoj bn

    // QPay дээр invoice үүсгэнэ
    const response = await QpayApi.create_invoice(invoice);
    if (response.data === undefined || response.status != 200)
      throw new Error("Could not create Invoice on QPay!");

    const qpayInvoice = response.data;
    const data = {
      invoice_id: invoice.id,
      qpay_id: qpayInvoice.invoice_id,
      qr_text: qpayInvoice.qr_text,
      qr_image: qpayInvoice.qr_image,
      urls: qpayInvoice.urls,
      amount: invoice.amount,
		}

		console.log('QPay Invoice ' + qpayInvoice.invoice_id, data.amount)

		return await this.prisma.qpay.create({ data })
	}

	/**
	 * QPay Invoice-г төлөгдсөн төлөвт оруулна
	 * @param {Int} id
	 * @returns paidInvoice
	 */
	async setPaid(id) {
    const order = await this.get(id);
		if (!order) {
			console.error('QPay order not found!')
			return false
		}

		console.log('Setting Paid: QPay order found!')

    const options = {
      where: {
        order_id: order.id,
      },
			data: { is_paid: true }
		}

		const { count } = await this.prisma.order.updateMany(options)

		if (count) console.log('Setting Paid: QPay invoice paid!')

		return count
	}
}

export default new QpayModel()

// TEST DATA for QPay API
//
// const qpayData = {
// 	invoice_code: config.QPAY_INVOICE_CODE,
// 	sender_invoice_no: data.neo_invoice_id, // nehemjlehiin dugaar
// 	invoice_receiver_code: data.keyword.trim().toUpperCase(), // hariltsagchiin dugaar
// 	invoice_description: `HiCargo ${data.name}`,
// 	amount: data.amount,
// 	callback_url: config.QPAY_CALLBACK_URL + invoice.id
// }
