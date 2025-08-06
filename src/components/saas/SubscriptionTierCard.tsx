import React from 'react';
import { Check, X, Crown, Star, ArrowRight } from 'lucide-react';
import { SubscriptionTier } from '../../contexts/SaaSContext';
import { BrandedCard, BrandedButton } from '../branding/BrandedComponents';

// ===========================================
// SUBSCRIPTION TIER CARD COMPONENT
// ===========================================

interface SubscriptionTierCardProps {
  tier: SubscriptionTier;
  currentTier?: string;
  billingCycle: 'monthly' | 'yearly';
  onSelectTier: (tierId: string) => void;
  isLoading?: boolean;
  showFeatures?: boolean;
  compact?: boolean;
}

export const SubscriptionTierCard: React.FC<SubscriptionTierCardProps> = ({
  tier,
  currentTier,
  billingCycle,
  onSelectTier,
  isLoading = false,
  showFeatures = true,
  compact = false
}) => {
  const isCurrentTier = currentTier === tier.id;
  const price = billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
  const monthlyPrice = billingCycle === 'yearly' ? tier.yearlyPrice / 12 : tier.monthlyPrice;
  const savings = billingCycle === 'yearly' ? (tier.monthlyPrice * 12 - tier.yearlyPrice) : 0;

  const getTierIcon = () => {
    switch (tier.name) {
      case 'starter':
        return <Star className="h-6 w-6" />;
      case 'professional':
        return <ArrowRight className="h-6 w-6" />;
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  const getTierColor = () => {
    switch (tier.name) {
      case 'starter':
        return 'border-gray-200 bg-white';
      case 'professional':
        return 'border-indigo-200 bg-indigo-50 ring-2 ring-indigo-500';
      case 'enterprise':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getButtonStyle = () => {
    if (isCurrentTier) {
      return 'bg-gray-100 text-gray-600 cursor-not-allowed';
    }
    
    switch (tier.name) {
      case 'starter':
        return 'bg-gray-900 text-white hover:bg-gray-800';
      case 'professional':
        return 'bg-indigo-600 text-white hover:bg-indigo-700';
      case 'enterprise':
        return 'bg-purple-600 text-white hover:bg-purple-700';
      default:
        return 'bg-indigo-600 text-white hover:bg-indigo-700';
    }
  };

  return (
    <div className={`relative rounded-lg border-2 ${getTierColor()} ${compact ? 'p-4' : 'p-6'}`}>
      {/* Popular Badge */}
      {tier.isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </span>
        </div>
      )}

      {/* Current Tier Badge */}
      {isCurrentTier && (
        <div className="absolute -top-4 right-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
            <Check className="h-3 w-3 mr-1" />
            Current Plan
          </span>
        </div>
      )}

      <div className="text-center">
        {/* Tier Icon & Name */}
        <div className="flex items-center justify-center mb-4">
          <div className={`p-2 rounded-lg ${
            tier.name === 'professional' ? 'bg-indigo-100 text-indigo-600' :
            tier.name === 'enterprise' ? 'bg-purple-100 text-purple-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {getTierIcon()}
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.displayName}</h3>
        
        {!compact && (
          <p className="text-gray-600 mb-6 min-h-[3rem]">{tier.description}</p>
        )}

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-gray-900">
              ${Math.round(monthlyPrice)}
            </span>
            <span className="text-gray-600 ml-1">/month</span>
          </div>
          
          {billingCycle === 'yearly' && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Billed yearly (${price})
              </p>
              {savings > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  Save ${savings}/year
                </p>
              )}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <BrandedButton
          onClick={() => onSelectTier(tier.id)}
          disabled={isCurrentTier || isLoading}
          className={`w-full mb-6 ${getButtonStyle()}`}
        >
          {isLoading ? (
            'Processing...'
          ) : isCurrentTier ? (
            'Current Plan'
          ) : tier.name === 'enterprise' ? (
            'Contact Sales'
          ) : (
            `Choose ${tier.displayName}`
          )}
        </BrandedButton>

        {/* Features List */}
        {showFeatures && !compact && (
          <div className="text-left">
            <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
            <ul className="space-y-2">
              {tier.features.slice(0, 6).map((feature) => (
                <li key={feature.id} className="flex items-start">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-gray-300 mr-3 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                      {feature.name}
                    </span>
                    {feature.limit && feature.included && (
                      <span className="text-xs text-gray-500 ml-1">
                        (up to {feature.limit})
                      </span>
                    )}
                    {feature.unlimited && feature.included && (
                      <span className="text-xs text-green-600 ml-1">
                        (unlimited)
                      </span>
                    )}
                  </div>
                </li>
              ))}
              
              {tier.features.length > 6 && (
                <li className="text-sm text-gray-500 italic">
                  + {tier.features.length - 6} more features
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Limits Summary for Compact View */}
        {compact && (
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
            <div>
              <span className="font-medium">Users:</span>{' '}
              {tier.limits.maxUsers === -1 ? 'Unlimited' : tier.limits.maxUsers}
            </div>
            <div>
              <span className="font-medium">Students:</span>{' '}
              {tier.limits.maxStudents === -1 ? 'Unlimited' : tier.limits.maxStudents}
            </div>
            <div>
              <span className="font-medium">Storage:</span>{' '}
              {tier.limits.storageGB}GB
            </div>
            <div>
              <span className="font-medium">Domain:</span>{' '}
              {tier.limits.customDomain ? 'Custom' : 'Subdomain'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTierCard;