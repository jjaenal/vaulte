const dataVaultWriteService = require('../services/dataVaultWriteService');

/**
 * Controller for DataVault write endpoints
 */
const dataVaultWriteController = {
  async registerCategory(req, res, next) {
    try {
      const { name, pricePerDayWei, dataHash } = req.body;

      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: true, message: 'Invalid name' });
      }
      if (!pricePerDayWei || BigInt(pricePerDayWei) <= 0n) {
        return res.status(400).json({ error: true, message: 'Invalid pricePerDayWei' });
      }
      if (!dataHash || typeof dataHash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(dataHash)) {
        return res.status(400).json({ error: true, message: 'Invalid dataHash (bytes32 hex)' });
      }

      const result = await dataVaultWriteService.registerCategory(name, BigInt(pricePerDayWei), dataHash);
      return res.status(201).json({ success: true, ...result });
    } catch (error) {
      // Map known custom errors to HTTP statuses
      const msg = String(error?.shortMessage || error?.message || 'Unknown error');
      if (msg.includes('EmptyName')) return res.status(400).json({ error: true, message: 'Empty name' });
      if (msg.includes('ZeroPrice')) return res.status(400).json({ error: true, message: 'Invalid price' });
      return next(error);
    }
  },

  async deactivateCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      if (!categoryId || BigInt(categoryId) <= 0n) {
        return res.status(400).json({ error: true, message: 'Invalid categoryId' });
      }
      const result = await dataVaultWriteService.deactivateCategory(BigInt(categoryId));
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      const msg = String(error?.shortMessage || error?.message || 'Unknown error');
      if (msg.includes('InvalidCategoryId')) return res.status(400).json({ error: true, message: 'Invalid category id' });
      if (msg.includes('CategoryNotExists')) return res.status(404).json({ error: true, message: 'Category not exists' });
      if (msg.includes('CategoryAlreadyInactive')) return res.status(409).json({ error: true, message: 'Category already inactive' });
      if (msg.includes('OwnableUnauthorizedAccount') || msg.includes('Unauthorized')) return res.status(403).json({ error: true, message: 'Unauthorized' });
      return next(error);
    }
  },

  async grantPermission(req, res, next) {
    try {
      const { categoryId, buyer, durationDays } = req.body;
      if (!categoryId || BigInt(categoryId) <= 0n) {
        return res.status(400).json({ error: true, message: 'Invalid categoryId' });
      }
      if (!buyer || typeof buyer !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(buyer)) {
        return res.status(400).json({ error: true, message: 'Invalid buyer address' });
      }
      if (!durationDays || Number(durationDays) <= 0) {
        return res.status(400).json({ error: true, message: 'Invalid durationDays' });
      }

      const result = await dataVaultWriteService.grantPermission(BigInt(categoryId), buyer, Number(durationDays));
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      const msg = String(error?.shortMessage || error?.message || 'Unknown error');
      if (msg.includes('ZeroAddress')) return res.status(400).json({ error: true, message: 'Zero address' });
      if (msg.includes('ZeroDuration')) return res.status(400).json({ error: true, message: 'Zero duration' });
      if (msg.includes('InvalidCategoryId')) return res.status(400).json({ error: true, message: 'Invalid category id' });
      if (msg.includes('CategoryNotExists')) return res.status(404).json({ error: true, message: 'Category not exists' });
      if (msg.includes('CategoryInactive')) return res.status(409).json({ error: true, message: 'Category inactive' });
      if (msg.includes('OwnableUnauthorizedAccount') || msg.includes('Unauthorized')) return res.status(403).json({ error: true, message: 'Unauthorized' });
      return next(error);
    }
  },

  async revokePermission(req, res, next) {
    try {
      const { categoryId, buyer } = req.body;
      if (!categoryId || BigInt(categoryId) <= 0n) {
        return res.status(400).json({ error: true, message: 'Invalid categoryId' });
      }
      if (!buyer || typeof buyer !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(buyer)) {
        return res.status(400).json({ error: true, message: 'Invalid buyer address' });
      }

      const result = await dataVaultWriteService.revokePermission(BigInt(categoryId), buyer);
      const formatted = {
        success: true,
        hash: result.hash,
        status: result.status,
        refundAmount: result.refundAmount != null ? result.refundAmount.toString() : null,
      };
      return res.status(200).json(formatted);
    } catch (error) {
      const msg = String(error?.shortMessage || error?.message || 'Unknown error');
      if (msg.includes('ZeroAddress')) return res.status(400).json({ error: true, message: 'Zero address' });
      if (msg.includes('InvalidCategoryId')) return res.status(400).json({ error: true, message: 'Invalid category id' });
      if (msg.includes('PermissionNotGranted')) return res.status(409).json({ error: true, message: 'Permission not granted' });
      if (msg.includes('OwnableUnauthorizedAccount') || msg.includes('Unauthorized')) return res.status(403).json({ error: true, message: 'Unauthorized' });
      return next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { newPricePerDayWei, newDataHash } = req.body;

      if (!categoryId || BigInt(categoryId) <= 0n) {
        return res.status(400).json({ error: true, message: 'Invalid categoryId' });
      }
      if (!newPricePerDayWei || BigInt(newPricePerDayWei) <= 0n) {
        return res.status(400).json({ error: true, message: 'Invalid newPricePerDayWei' });
      }
      if (!newDataHash || typeof newDataHash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(newDataHash)) {
        return res.status(400).json({ error: true, message: 'Invalid newDataHash (bytes32 hex)' });
      }

      const result = await dataVaultWriteService.updateCategory(
        BigInt(categoryId),
        BigInt(newPricePerDayWei),
        newDataHash
      );
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      const msg = String(error?.shortMessage || error?.message || 'Unknown error');
      if (msg.includes('InvalidCategoryId')) return res.status(400).json({ error: true, message: 'Invalid category id' });
      if (msg.includes('ZeroPrice')) return res.status(400).json({ error: true, message: 'Invalid price' });
      if (msg.includes('CategoryNotExists')) return res.status(404).json({ error: true, message: 'Category not exists' });
      if (msg.includes('OwnableUnauthorizedAccount') || msg.includes('Unauthorized')) return res.status(403).json({ error: true, message: 'Unauthorized' });
      return next(error);
    }
  },
};

module.exports = dataVaultWriteController;